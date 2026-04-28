import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api } from '../../../services/api';
import type { EntityRequestStateMap, Food, Ingredient, Recipe, TabKey } from '../types';

type PaginationInfo = {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
};

type PaginationState = Record<'foods' | 'ingredients' | 'recipes', PaginationInfo>;
type EntityFetchState = EntityRequestStateMap;

type LoaderResult<T> = {
  data: T[];
  error?: string;
  pagination: PaginationInfo;
};

type EntityKey = keyof PaginationState;

interface ListEnvelope<T> {
  data?: T[] | unknown;
  items?: T[] | unknown;
  content?: T[] | unknown;
  result?: T[] | unknown;
  payload?: T[] | unknown;
}

const COLLECTION_KEYS = ['data', 'items', 'content', 'result', 'payload'] as const;
const MAX_COLLECTION_SEARCH_DEPTH = 3;
const MAX_JSON_PARSE_DEPTH = 2;

function parseJsonStringCandidate(payload: unknown, parseDepth = 0): unknown {
  if (typeof payload !== 'string' || parseDepth >= MAX_JSON_PARSE_DEPTH) return payload;

  const trimmed = payload.trim();
  if (!trimmed) return payload;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed === 'string') {
      return parseJsonStringCandidate(parsed, parseDepth + 1);
    }
    return parsed;
  } catch {
    return payload;
  }
}

function looksLikeEntityCollection(value: unknown) {
  if (!Array.isArray(value)) return false;
  const firstDefinedItem = value.find((item) => item != null);
  if (firstDefinedItem == null) return true;
  return typeof firstDefinedItem === 'object';
}

function findCaseInsensitiveArray<T>(candidate: Record<string, unknown>, keys: string[]) {
  if (!keys.length) return null;

  const entries = Object.entries(candidate);
  for (const key of keys) {
    const matched = entries.find(([entryKey]) => entryKey.toLowerCase() === key.toLowerCase());
    if (matched && Array.isArray(matched[1])) return matched[1] as T[];
  }

  return null;
}

export function extractCollection<T>(
  payload: unknown,
  depth = 0,
  preferredKeys: string[] = []
): T[] {
  const normalizedPayload = parseJsonStringCandidate(payload);

  if (looksLikeEntityCollection(normalizedPayload)) return normalizedPayload as T[];
  if (Array.isArray(normalizedPayload)) return [];
  if (!normalizedPayload || typeof normalizedPayload !== 'object' || depth > MAX_COLLECTION_SEARCH_DEPTH) return [];

  const candidate = normalizedPayload as ListEnvelope<T> & Record<string, unknown>;

  const preferredMatch = findCaseInsensitiveArray<T>(candidate, preferredKeys);
  if (preferredMatch) return preferredMatch;

  for (const key of COLLECTION_KEYS) {
    const value = parseJsonStringCandidate(candidate[key]);
    if (looksLikeEntityCollection(value)) return value as T[];
    const nested = extractCollection<T>(value, depth + 1, preferredKeys);
    if (nested.length > 0) return nested;
  }

  for (const rawValue of Object.values(candidate)) {
    const value = parseJsonStringCandidate(rawValue);
    if (looksLikeEntityCollection(value)) return value as T[];
    if (!value || typeof value !== 'object') continue;
    const nested = extractCollection<T>(value, depth + 1, preferredKeys);
    if (nested.length > 0) return nested;
  }

  for (const rawValue of Object.values(candidate)) {
    const value = parseJsonStringCandidate(rawValue);
    if (!value || Array.isArray(value) || typeof value !== 'object') continue;
    const nested = extractCollection<T>(value, depth + 1, preferredKeys);
    if (nested.length > 0) return nested;
  }

  return [];
}

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PAGINATION: PaginationInfo = {
  page: 0,
  size: DEFAULT_PAGE_SIZE,
  totalPages: 0,
  totalElements: 0,
  numberOfElements: 0,
  first: true,
  last: true
};

const defaultPaginationState = (): PaginationState => ({
  foods: { ...DEFAULT_PAGINATION },
  ingredients: { ...DEFAULT_PAGINATION },
  recipes: { ...DEFAULT_PAGINATION }
});

const defaultEntityFetchState = (): EntityFetchState => ({
  foods: { loading: false, error: '' },
  ingredients: { loading: false, error: '' },
  recipes: { loading: false, error: '' }
});

export function mapLoadError(loadError: unknown, fallbackMessage: string) {
  if (loadError instanceof ApiError) {
    if (loadError.isNetworkError || loadError.code === 'NETWORK_ERROR') {
      return 'Cannot connect to the backend. This is usually a CORS or API URL configuration issue. If you are using the Vite dev server, leave VITE_API_BASE_URL empty to use the proxy.';
    }
    if (loadError.status === 404) {
      return 'Backend endpoint was not found (404). Please start the backend service or verify the API URL.';
    }
    if (loadError.status != null && loadError.status >= 500) {
      return 'Backend server error (500). Please try again later.';
    }
  }

  if (loadError instanceof Error && /<!doctype|<html/i.test(loadError.message)) {
    return 'Backend response was not valid API data. Please start the backend service and try again.';
  }

  return loadError instanceof Error ? loadError.message : fallbackMessage;
}

export default function useBackendData() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pagination, setPagination] = useState<PaginationState>(defaultPaginationState);
  const [entityFetchState, setEntityFetchState] = useState<EntityFetchState>(defaultEntityFetchState);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const isMountedRef = useRef(true);
  const entityRequestIdRef = useRef<Record<EntityKey, number>>({
    foods: 0,
    ingredients: 0,
    recipes: 0
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getPaginationInfo = useCallback((payload: {
    number?: number;
    size?: number;
    totalPages?: number;
    totalElements?: number;
    numberOfElements?: number;
    first?: boolean;
    last?: boolean;
    content?: unknown[];
  }, fallbackPage: number) => {
    const totalPages = typeof payload.totalPages === 'number' ? payload.totalPages : 1;
    const contentLength = Array.isArray(payload.content) ? payload.content.length : 0;
    const page = typeof payload.number === 'number' ? payload.number : fallbackPage;

    return {
      page,
      size: typeof payload.size === 'number' ? payload.size : DEFAULT_PAGE_SIZE,
      totalPages,
      totalElements: typeof payload.totalElements === 'number' ? payload.totalElements : contentLength,
      numberOfElements: typeof payload.numberOfElements === 'number' ? payload.numberOfElements : contentLength,
      first: typeof payload.first === 'boolean' ? payload.first : page <= 0,
      last: typeof payload.last === 'boolean' ? payload.last : page >= Math.max(totalPages - 1, 0)
    } satisfies PaginationInfo;
  }, []);

  const loadFoods = useCallback(async (page = 0): Promise<LoaderResult<Food>> => {
    try {
      const foodPage = await api.getFoodsPage(page, DEFAULT_PAGE_SIZE);
      return { data: foodPage.content ?? [], pagination: getPaginationInfo(foodPage, page) };
    } catch (loadError) {
      return {
        data: [],
        pagination: { ...DEFAULT_PAGINATION, page },
        error: mapLoadError(loadError, 'Failed to load foods.')
      };
    }
  }, [getPaginationInfo]);

  const loadIngredients = useCallback(async (page = 0): Promise<LoaderResult<Ingredient>> => {
    try {
      const ingredientPage = await api.getIngredientsPage(page, DEFAULT_PAGE_SIZE);
      return { data: ingredientPage.content ?? [], pagination: getPaginationInfo(ingredientPage, page) };
    } catch (loadError) {
      return {
        data: [],
        pagination: { ...DEFAULT_PAGINATION, page },
        error: mapLoadError(loadError, 'Failed to load ingredients.')
      };
    }
  }, [getPaginationInfo]);

  const loadRecipes = useCallback(async (page = 0): Promise<LoaderResult<Recipe>> => {
    try {
      const recipePage = await api.getRecipesPage(page, DEFAULT_PAGE_SIZE);
      return { data: recipePage.content ?? [], pagination: getPaginationInfo(recipePage, page) };
    } catch (loadError) {
      return {
        data: [],
        pagination: { ...DEFAULT_PAGINATION, page },
        error: mapLoadError(loadError, 'Failed to load recipes.')
      };
    }
  }, [getPaginationInfo]);

  const setEntityLoading = useCallback((entity: EntityKey, loading: boolean) => {
    setEntityFetchState((prev) => ({
      ...prev,
      [entity]: {
        ...prev[entity],
        loading
      }
    }));
  }, []);

  const setEntityError = useCallback((entity: EntityKey, error: string) => {
    setEntityFetchState((prev) => ({
      ...prev,
      [entity]: {
        ...prev[entity],
        error
      }
    }));
  }, []);

  const loadEntityPage = useCallback(async (entity: EntityKey, page = 0) => {
    const requestId = entityRequestIdRef.current[entity] + 1;
    entityRequestIdRef.current[entity] = requestId;
    setEntityLoading(entity, true);
    setEntityError(entity, '');

    try {
      const result = entity === 'foods'
        ? await loadFoods(page)
        : entity === 'ingredients'
          ? await loadIngredients(page)
          : await loadRecipes(page);

      if (!isMountedRef.current || entityRequestIdRef.current[entity] !== requestId) return;

      if (entity === 'foods') {
        setFoods(result.data);
        setPagination((prev) => ({ ...prev, foods: result.pagination }));
      } else if (entity === 'ingredients') {
        setIngredients(result.data);
        setPagination((prev) => ({ ...prev, ingredients: result.pagination }));
      } else {
        setRecipes(result.data);
        setPagination((prev) => ({ ...prev, recipes: result.pagination }));
      }

      if (result.error) setEntityError(entity, result.error);
    } catch (entityError) {
      if (!isMountedRef.current || entityRequestIdRef.current[entity] !== requestId) return;
      setEntityError(entity, entityError instanceof Error ? entityError.message : 'Failed to load data.');
    } finally {
      if (isMountedRef.current && entityRequestIdRef.current[entity] === requestId) {
        setEntityLoading(entity, false);
      }
    }
  }, [loadFoods, loadIngredients, loadRecipes, setEntityError, setEntityLoading]);

  const loadAll = useCallback(async () => {
    setActionError('');
    await Promise.all([
      loadEntityPage('foods', 0),
      loadEntityPage('ingredients', 0),
      loadEntityPage('recipes', 0)
    ]);
  }, [loadEntityPage]);

  const loadTabData = useCallback(async (tab: TabKey, page?: number) => {
    setActionError('');
    if (tab === 'dashboard') {
      await loadAll();
      return;
    }
    if (tab === 'foods') {
      const nextPage = Math.max(0, page ?? pagination.foods.page ?? 0);
      await loadEntityPage('foods', nextPage);
      return;
    }
    if (tab === 'ingredients' || tab === 'nutrition') {
      const nextPage = Math.max(0, page ?? pagination.ingredients.page ?? 0);
      await loadEntityPage('ingredients', nextPage);
      return;
    }
    const nextPage = Math.max(0, page ?? pagination.recipes.page ?? 0);
    await loadEntityPage('recipes', nextPage);
  }, [loadAll, loadEntityPage, pagination]);

  const refreshFoods = useCallback(async () => {
    await loadEntityPage('foods', 0);
  }, [loadEntityPage]);

  const refreshIngredients = useCallback(async () => {
    await loadEntityPage('ingredients', 0);
  }, [loadEntityPage]);

  const refreshRecipes = useCallback(async () => {
    await loadEntityPage('recipes', 0);
  }, [loadEntityPage]);

  const runWithRefresh = useCallback(async (action: () => Promise<unknown> | unknown) => {
    setActionLoading(true);
    setActionError('');
    try {
      await action();
      await loadAll();
    } catch (actionError) {
      setActionError(actionError instanceof Error ? actionError.message : 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  }, [loadAll]);

  const loading = actionLoading || Object.values(entityFetchState).some((state) => state.loading);
  const entityErrors = Object.values(entityFetchState)
    .map((state) => state.error)
    .filter(Boolean);
  const error = actionError || [...new Set(entityErrors)].join(' | ');

  return {
    foods,
    ingredients,
    recipes,
    pagination,
    error,
    loading,
    loadingByEntity: entityFetchState,
    errorByEntity: entityFetchState,
    setLoading: setActionLoading,
    setError: setActionError,
    loadAll,
    loadTabData,
    runWithRefresh,
    refreshFoods,
    refreshIngredients,
    refreshRecipes
  };
}
