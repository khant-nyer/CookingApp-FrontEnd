import {useCallback, useMemo} from 'react';
import { getItemId, getRecipeTileId } from '../utils/ids';
import useExplorerCreateFlow from './useExplorerCreateFlow';
import useExplorerDeleteFlow from './useExplorerDeleteFlow';
import useExplorerUpdateFlow from './useExplorerUpdateFlow';
import useExplorerViewState from './useExplorerViewState';
import type { BackendExplorerController } from '../types';

export {
  appendUpdateNutritionToForm,
  executeDeleteConfirmation,
  executeUpdateConfirmation
} from './backendExplorerFlowHelpers';

export default function useBackendExplorerController(): BackendExplorerController {
  const viewStateCore = useExplorerViewState();
  const {
    loadAll,
    refreshFoods,
    refreshIngredients,
    refreshRecipes
  } = viewStateCore;

  const runByEntity = useCallback(async (
    entity: 'food' | 'ingredient' | 'recipe',
    action: () => Promise<unknown> | unknown
  ) => {
    await action();
    if (entity === 'food') {
      await refreshFoods();
      return;
    }
    if (entity === 'ingredient') {
      await refreshIngredients();
      return;
    }
    await refreshRecipes();
  }, [refreshFoods, refreshIngredients, refreshRecipes]);

  const createFlow = useExplorerCreateFlow({
    ingredients: viewStateCore.ingredients,
    setLoading: viewStateCore.setLoading,
    refreshFoods,
    refreshIngredients,
    refreshRecipes
  });

  const updateFlow = useExplorerUpdateFlow({
    runByEntity
  });

  const deleteFlow = useExplorerDeleteFlow({ runByEntity });

  const selectedFood = useMemo(
    () => viewStateCore.foods.find((item) => String(getItemId(item)) === String(viewStateCore.selectedId)),
    [viewStateCore.foods, viewStateCore.selectedId]
  );

  const selectedIngredient = useMemo(
    () => viewStateCore.ingredients.find((item) => String(getItemId(item)) === String(viewStateCore.selectedId)),
    [viewStateCore.ingredients, viewStateCore.selectedId]
  );

  const selectedRecipe = useMemo(
    () => viewStateCore.recipes.find((item, index) => String(getRecipeTileId(item, index)) === String(viewStateCore.selectedId)),
    [viewStateCore.recipes, viewStateCore.selectedId]
  );

  const nutrientFilteredIngredients = useMemo(
    () => viewStateCore.ingredients.filter((ingredient) => Array.isArray(ingredient?.nutritionList)
      && ingredient.nutritionList.some((nutrition) => nutrition?.nutrient === viewStateCore.selectedNutrient)),
    [viewStateCore.ingredients, viewStateCore.selectedNutrient]
  );

  const viewState = useMemo(() => ({
    selectedId: viewStateCore.selectedId,
    setSelectedId: viewStateCore.setSelectedId,
    selectedNutrient: viewStateCore.selectedNutrient,
    setSelectedNutrient: viewStateCore.setSelectedNutrient,
    error: viewStateCore.error,
    loading: viewStateCore.loading,
    loadingByEntity: viewStateCore.loadingByEntity,
    errorByEntity: viewStateCore.errorByEntity,
    loadAll,
    refreshFoods,
    refreshIngredients,
    refreshRecipes,
    pagination: viewStateCore.pagination,
    loadTabData: viewStateCore.loadTabData
  }), [
    viewStateCore.selectedId,
    viewStateCore.setSelectedId,
    viewStateCore.selectedNutrient,
    viewStateCore.setSelectedNutrient,
    viewStateCore.error,
    viewStateCore.loading,
    viewStateCore.loadingByEntity,
    viewStateCore.errorByEntity,
    loadAll,
    refreshFoods,
    refreshIngredients,
    refreshRecipes,
    viewStateCore.pagination,
    viewStateCore.loadTabData
  ]);

  const entities = useMemo(() => ({
    foods: viewStateCore.foods,
    ingredients: viewStateCore.ingredients,
    recipes: viewStateCore.recipes,
    selectedFood,
    selectedIngredient,
    selectedRecipe,
    nutrientFilteredIngredients
  }), [
    viewStateCore.foods,
    viewStateCore.ingredients,
    viewStateCore.recipes,
    selectedFood,
    selectedIngredient,
    selectedRecipe,
    nutrientFilteredIngredients
  ]);

  return {
    viewState,
    createFlow,
    updateFlow,
    deleteFlow,
    entities
  };
}
