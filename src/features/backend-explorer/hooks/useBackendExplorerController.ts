import { useMemo } from 'react';
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

  async function run(action: () => Promise<unknown> | unknown) {
    await viewStateCore.runWithRefresh(action);
  }

  const createFlow = useExplorerCreateFlow({
    ingredients: viewStateCore.ingredients,
    setLoading: viewStateCore.setLoading,
    loadAll: viewStateCore.loadAll
  });

  const updateFlow = useExplorerUpdateFlow({
    run,
    setError: viewStateCore.setError
  });

  const deleteFlow = useExplorerDeleteFlow({ run });

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

  return {
    viewState: {
      activeTab: viewStateCore.activeTab,
      setActiveTab: viewStateCore.setActiveTab,
      selectedId: viewStateCore.selectedId,
      setSelectedId: viewStateCore.setSelectedId,
      selectedNutrient: viewStateCore.selectedNutrient,
      setSelectedNutrient: viewStateCore.setSelectedNutrient,
      error: viewStateCore.error,
      loading: viewStateCore.loading,
      loadAll: viewStateCore.loadAll
    },
    createFlow,
    updateFlow,
    deleteFlow,
    entities: {
      foods: viewStateCore.foods,
      ingredients: viewStateCore.ingredients,
      recipes: viewStateCore.recipes,
      selectedFood,
      selectedIngredient,
      selectedRecipe,
      nutrientFilteredIngredients
    }
  };
}
