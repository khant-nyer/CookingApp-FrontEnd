import { useReducer } from 'react';
import { getItemId } from '../utils/ids';
import { normalizeNutrientKey } from '../utils/nutrients';
import { initialUpdateFlowState, updateFlowReducer } from '../reducers/updateFlowReducer';
import { appendUpdateNutritionToForm, executeUpdateConfirmation } from './backendExplorerFlowHelpers';
import type {
  Ingredient,
  IngredientUpdateForm,
  NutritionDraft,
  Recipe,
  Updater,
  UpdateModalState
} from '../types';

interface Params {
  run: (action: () => Promise<unknown> | unknown) => Promise<void>;
  setError: (message: string) => void;
}

export default function useExplorerUpdateFlow({ run, setError }: Params) {
  const [updateFlowState, dispatchUpdateFlow] = useReducer(updateFlowReducer, initialUpdateFlowState);
  const { updateNutritionDraft, updateModal } = updateFlowState;

  function setUpdateModal(value: Updater<UpdateModalState>) {
    dispatchUpdateFlow({ type: 'set_update_modal', value });
  }

  function setUpdateNutritionDraft(value: Updater<NutritionDraft>) {
    dispatchUpdateFlow({ type: 'set_update_nutrition_draft', value });
  }

  function addUpdateNutrition() {
    if (!updateNutritionDraft.value) return setError('Nutrition value is required.');

    setUpdateModal((prev) => {
      const form = prev.form as IngredientUpdateForm;
      const nextForm = appendUpdateNutritionToForm(form, updateNutritionDraft);
      if (!nextForm) {
        setError('Nutrition value must be a valid number.');
        return prev;
      }

      return {
        ...prev,
        form: nextForm
      };
    });
    setUpdateNutritionDraft((prev) => ({ ...prev, value: '' }));
  }

  function openIngredientUpdateModal(item: Ingredient) {
    setUpdateNutritionDraft({ nutrient: 'CALORIES', value: '', unit: 'G' });
    setUpdateModal({
      open: true,
      type: 'ingredient',
      itemId: getItemId(item) || null,
      title: `Update ${item?.name || 'Ingredient'}`,
      form: {
        name: item?.name || '',
        category: item?.category || '',
        description: item?.description || '',
        servingAmount: String(item?.servingAmount ?? ''),
        servingUnit: item?.servingUnit || 'G',
        imageUrl: item?.imageUrl || '',
        nutritionList: Array.isArray(item?.nutritionList)
          ? item.nutritionList.map((n) => ({ nutrient: normalizeNutrientKey(n.nutrient), value: n.value ?? '', unit: n.unit || 'G' }))
          : []
      }
    });
  }

  function openRecipeUpdateModal(item: Recipe) {
    setUpdateModal({
      open: true,
      type: 'recipe',
      itemId: getItemId(item) || null,
      title: `Update ${item?.foodName || 'Recipe'} ${item?.version ? `(${item.version})` : ''}`,
      form: {
        foodId: String(item?.foodId ?? ''),
        version: item?.version || '',
        description: item?.description || '',
        ingredients: Array.isArray(item?.ingredients)
          ? item.ingredients.map((ri) => ({ ingredientId: String(ri.ingredientId ?? ''), quantity: String(ri.quantity ?? ''), unit: ri.unit || 'G', note: ri.note || '' }))
          : [],
        instructions: Array.isArray(item?.instructions)
          ? item.instructions.map((inst) => ({ description: inst.description || '', tutorialVideoUrl: inst.tutorialVideoUrl || '' }))
          : []
      }
    });
  }

  async function confirmUpdate() {
    await executeUpdateConfirmation({ updateModal, run });
    setUpdateModal({ open: false, type: '', title: '', itemId: null, form: null });
  }

  return {
    updateModal,
    setUpdateModal,
    updateNutritionDraft,
    setUpdateNutritionDraft,
    addUpdateNutrition,
    openIngredientUpdateModal,
    openRecipeUpdateModal,
    confirmUpdate
  };
}
