import { api } from '../../../services/api';
import { normalizeNutritionEntry } from '../utils/nutrients';
import {
  buildUpdateFoodPayload,
  buildUpdateIngredientPayload,
  buildUpdateRecipePayload
} from '../utils/payloadMappers';
import type {
  DeleteModalState,
  FoodUpdateForm,
  IngredientUpdateForm,
  NutritionDraft,
  RecipeUpdateForm,
  UpdateModalState,
  Updater
} from '../types';

export function appendUpdateNutritionToForm(form: IngredientUpdateForm, draft: NutritionDraft) {
  const nutritionEntry = normalizeNutritionEntry(draft);
  if (!nutritionEntry) return null;

  return {
    ...form,
    nutritionList: [...(form.nutritionList || []), nutritionEntry]
  };
}

export async function executeDeleteConfirmation({
  deleteModal,
  run,
  setDeleteModal
}: {
  deleteModal: DeleteModalState;
  run: (action: () => Promise<unknown> | unknown) => Promise<void>;
  setDeleteModal: (value: Updater<DeleteModalState>) => void;
}) {
  if (!deleteModal.action) {
    setDeleteModal({ open: false, message: '', action: null });
    return;
  }

  await run(deleteModal.action);
  setDeleteModal({ open: false, message: '', action: null });
}

export async function executeUpdateConfirmation({
  updateModal,
  run
}: {
  updateModal: UpdateModalState;
  run: (action: () => Promise<unknown> | unknown) => Promise<void>;
}) {
  if (updateModal.type === 'ingredient') {
    const form = updateModal.form as IngredientUpdateForm;
    await run(() => api.updateIngredient(updateModal.itemId, buildUpdateIngredientPayload(form)));
  }

  if (updateModal.type === 'food') {
    const form = updateModal.form as FoodUpdateForm;
    await run(() => api.updateFood(updateModal.itemId, buildUpdateFoodPayload(form)));
  }

  if (updateModal.type === 'recipe') {
    const form = updateModal.form as RecipeUpdateForm;
    await run(() => api.updateRecipe(updateModal.itemId, buildUpdateRecipePayload(form)));
  }
}
