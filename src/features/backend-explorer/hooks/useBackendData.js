import { useCallback, useState } from 'react';
import { api } from '../../../services/api';

export default function useBackendData() {
  const [foods, setFoods] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
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
      setFoods(Array.isArray(foodData) ? foodData : []);
      setIngredients(Array.isArray(ingredientData) ? ingredientData : []);
      setRecipes(Array.isArray(recipeData) ? recipeData : []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const runWithRefresh = useCallback(async (action) => {
    setLoading(true);
    setError('');
    try {
      await action();
      await loadAll();
    } catch (actionError) {
      setError(actionError.message);
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
