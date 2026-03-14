import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../services/api';
import type { Food, Ingredient, Recipe, TabKey } from '../types';

type LoaderResult<T> = { data: T[]; error?: string };

interface ListEnvelope<T> {
  data?: T[];
  items?: T[];
  content?: T[];
}

export function extractCollection<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const candidate = payload as ListEnvelope<T>;
  if (Array.isArray(candidate.data)) return candidate.data;
  if (Array.isArray(candidate.items)) return candidate.items;
  if (Array.isArray(candidate.content)) return candidate.content;

  return [];
}

type LoaderResult<T> = { data: T[]; error?: string };

export default function useBackendData() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const latestRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const tabRequestRef = useRef<Partial<Record<TabKey, Promise<void>>>>({});

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const loadFoods = useCallback(async (): Promise<LoaderResult<Food>> => {
    try {
      const foodData = await api.getFoods();
      return { data: extractCollection<Food>(foodData) };
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
      return { data: extractCollection<Ingredient>(ingredientData) };
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
      return { data: extractCollection<Recipe>(recipeData) };
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

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    setLoading(true);
    setError('');

    const applyResult = <T,>(result: LoaderResult<T>, setter: (value: T[]) => void) => {
      setter(result.data);
      if (result.error) setError(result.error);
    };

    const requestPromise = (async () => {
      try {
        if (tab === 'foods') {
          const result = await loadFoods();
          if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return;
          applyResult(result, setFoods);
        }

        if (tab === 'ingredients' || tab === 'nutrition') {
          const result = await loadIngredients();
          if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return;
          applyResult(result, setIngredients);
        }

        if (tab === 'recipes') {
          const result = await loadRecipes();
          if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return;
          applyResult(result, setRecipes);
        }
      } finally {
        if (isMountedRef.current && requestId === latestRequestIdRef.current) {
          setLoading(false);
        }
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
