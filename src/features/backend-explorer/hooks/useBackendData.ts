import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../services/api';
import type { Food, Ingredient, Recipe, TabKey } from '../types';

type LoaderResult<T> = { data: T[]; error?: string };

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

export default function useBackendData() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const latestRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const tabRequestRef = useRef<Partial<Record<TabKey, Promise<void>>>>({});

  useEffect(() => {
    isMountedRef.current = true;   // ← ADD THIS reset
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadFoods = useCallback(async (): Promise<LoaderResult<Food>> => {
    try {
      const foodData = await api.getFoods();
      return { data: extractCollection<Food>(foodData, 0, ['foods']) };
    } catch (loadError) {
      return {
        data: [],
        error: loadError instanceof Error ? loadError.message : 'Failed to load foods.'
      };
    }
  }, []);

  const loadIngredients = useCallback(async (): Promise<LoaderResult<Ingredient>> => {
    try {
      const ingredientData = await api.getIngredients();
      return { data: extractCollection<Ingredient>(ingredientData, 0, ['ingredients']) };
    } catch (loadError) {
      return {
        data: [],
        error: loadError instanceof Error ? loadError.message : 'Failed to load ingredients.'
      };
    }
  }, []);

  const loadRecipes = useCallback(async (): Promise<LoaderResult<Recipe>> => {
    try {
      const recipeData = await api.getRecipes();
      return { data: extractCollection<Recipe>(recipeData, 0, ['recipes']) };
    } catch (loadError) {
      return {
        data: [],
        error: loadError instanceof Error ? loadError.message : 'Failed to load recipes.'
      };
    }
  }, []);

  const loadAll = useCallback(async () => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    setLoading(true);
    setError('');

    try {
      const [foodsResult, ingredientsResult, recipesResult] = await Promise.all([
        loadFoods(),
        loadIngredients(),
        loadRecipes()
      ]);

      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return;

      setFoods(foodsResult.data);
      setIngredients(ingredientsResult.data);
      setRecipes(recipesResult.data);

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

  const loadTabData = useCallback(async (tab: TabKey) => {
    const inFlightRequest = tabRequestRef.current[tab];
    if (inFlightRequest) return inFlightRequest;

    setLoading(true);
    setError('');

    const requestPromise = (async () => {
      try {
        if (tab === 'foods') {
          const result = await loadFoods();
          setFoods(result.data);
          if (result.error) setError(result.error);
        } else if (tab === 'ingredients' || tab === 'nutrition') {
          const result = await loadIngredients();
          setIngredients(result.data);
          if (result.error) setError(result.error);
        } else if (tab === 'recipes') {
          const result = await loadRecipes();
          setRecipes(result.data);
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
  }, [loadFoods, loadIngredients, loadRecipes]);

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
    error,
    loading,
    setLoading,
    setError,
    loadAll,
    loadTabData,
    runWithRefresh
  };
}
