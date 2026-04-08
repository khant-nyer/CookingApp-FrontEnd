import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api } from '../../../services/api';
import type { Food, Ingredient, Recipe, TabKey } from '../types';

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

type LoaderResult<T> = {
  data: T[];
  error?: string;
  pagination: PaginationInfo;
};


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

function mapLoadError(loadError: unknown, fallbackMessage: string) {
  if (loadError instanceof ApiError) {
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const latestRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const tabRequestRef = useRef<Partial<Record<TabKey, Promise<void>>>>({});

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

  const loadAll = useCallback(async () => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    setLoading(true);
    setError('');

    try {
      const [foodsResult, ingredientsResult, recipesResult] = await Promise.all([
        loadFoods(0),
        loadIngredients(0),
        loadRecipes(0)
      ]);

      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return;

      setFoods(foodsResult.data);
      setIngredients(ingredientsResult.data);
      setRecipes(recipesResult.data);
      setPagination({
        foods: foodsResult.pagination,
        ingredients: ingredientsResult.pagination,
        recipes: recipesResult.pagination
      });

      const loadErrors = [foodsResult.error, ingredientsResult.error, recipesResult.error].filter(Boolean);
      if (loadErrors.length > 0) setError(loadErrors.join(' | '));
    } catch {
      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return;
      setError('Failed to load data.');
    } finally {
      if (isMountedRef.current && requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [loadFoods, loadIngredients, loadRecipes]);

  const loadTabData = useCallback(async (tab: TabKey, page?: number) => {
    const inFlightRequest = tabRequestRef.current[tab];
    if (inFlightRequest) return inFlightRequest;

    setLoading(true);
    setError('');

    const requestPromise = (async () => {
      try {
        if (tab === 'foods') {
          const nextPage = Math.max(0, page ?? pagination.foods.page ?? 0);
          const result = await loadFoods(nextPage);
          setFoods(result.data);
          setPagination((prev) => ({ ...prev, foods: result.pagination }));
          if (result.error) setError(result.error);
        } else if (tab === 'ingredients' || tab === 'nutrition') {
          const nextPage = Math.max(0, page ?? pagination.ingredients.page ?? 0);
          const result = await loadIngredients(nextPage);
          setIngredients(result.data);
          setPagination((prev) => ({ ...prev, ingredients: result.pagination }));
          if (result.error) setError(result.error);
        } else if (tab === 'recipes') {
          const nextPage = Math.max(0, page ?? pagination.recipes.page ?? 0);
          const result = await loadRecipes(nextPage);
          setRecipes(result.data);
          setPagination((prev) => ({ ...prev, recipes: result.pagination }));
          if (result.error) setError(result.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    })();

    tabRequestRef.current[tab] = requestPromise;

    await requestPromise;

    if (tabRequestRef.current[tab] === requestPromise) {
      delete tabRequestRef.current[tab];
    }
  }, [loadFoods, loadIngredients, loadRecipes, pagination]);

  const runWithRefresh = useCallback(async (action: () => Promise<unknown> | unknown) => {
    setLoading(true);
    setError('');
    try {
      await action();
      await loadAll();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed.');
      setLoading(false);
    }
  }, [loadAll]);

  return {
    foods,
    ingredients,
    recipes,
    pagination,
    error,
    loading,
    setLoading,
    setError,
    loadAll,
    loadTabData,
    runWithRefresh
  };
}
