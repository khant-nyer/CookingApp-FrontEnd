import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../services/api';
import type { Food, Ingredient, Recipe } from '../types';

export default function useBackendData() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const latestRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const loadAll = useCallback(async () => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    setLoading(true);
    setError('');

    try {
      const [foodData, ingredientData, recipeData] = await Promise.all([
        api.getFoods(),
        api.getIngredients(),
        api.getRecipes()
      ]);

      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return;

      setFoods(Array.isArray(foodData) ? foodData : []);
      setIngredients(Array.isArray(ingredientData) ? ingredientData : []);
      setRecipes(Array.isArray(recipeData) ? recipeData : []);
    } catch (loadError) {
      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Failed to load data.');
    } finally {
      if (isMountedRef.current && requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

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
    runWithRefresh
  };
}
