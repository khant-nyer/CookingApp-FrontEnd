import { useCallback, useState } from 'react';
import { api } from '../../../services/api';
import type { Food, Ingredient, Recipe } from '../types';

export default function useBackendData() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [foodData, ingredientData, recipeData] = await Promise.all([
        api.getFoods(),
        api.getIngredients(),
        api.getRecipes()
      ]);
      setFoods(Array.isArray(foodData) ? (foodData as Food[]) : []);
      setIngredients(Array.isArray(ingredientData) ? (ingredientData as Ingredient[]) : []);
      setRecipes(Array.isArray(recipeData) ? (recipeData as Recipe[]) : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load data.');
    } finally {
      setLoading(false);
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
