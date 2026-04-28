import { api } from '../../../services/api';
import { normalizeNutritionEntry } from '../utils/nutrients';
import {
  buildUpdateFoodPayload,
  buildUpdateIngredientPayload,
  buildUpdateRecipePayload
} from '../utils/payloadMappers';
import type {
  DeleteModalState,
  EntityType,
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
  runByEntity,
  run,
  setDeleteModal
}: {
  deleteModal: DeleteModalState;
  runByEntity?: (entity: EntityType, action: () => Promise<unknown> | unknown) => Promise<void>;
  run?: (action: () => Promise<unknown> | unknown) => Promise<void>;
  setDeleteModal: (value: Updater<DeleteModalState>) => void;
}) {
  if (!deleteModal.action) {
    setDeleteModal({ open: false, message: '', action: null });
    return;
  }

  if (deleteModal.entityType && runByEntity) {
    await runByEntity(deleteModal.entityType, deleteModal.action);
  } else if (run) {
    await run(deleteModal.action);
  }
  setDeleteModal({ open: false, message: '', action: null });
}

export async function executeUpdateConfirmation({
  updateModal,
  runByEntity,
  run
}: {
  updateModal: UpdateModalState;
  runByEntity?: (entity: EntityType, action: () => Promise<unknown> | unknown) => Promise<void>;
  run?: (action: () => Promise<unknown> | unknown) => Promise<void>;
}) {
  if (updateModal.type === 'ingredient') {
    const form = updateModal.form as IngredientUpdateForm;
    if (!form.name.trim()) {
      throw new Error('Ingredient name is required.');
    }
  }

  if (updateModal.type === 'food') {
    const form = updateModal.form as FoodUpdateForm;
    if (!form.name.trim()) {
      throw new Error('Food name is required.');
    }
  }

  if (updateModal.type === 'recipe') {
    const form = updateModal.form as RecipeUpdateForm;
    if (!form.foodId) {
      throw new Error('Please select food for recipe.');
    }
    if (!form.version.trim()) {
      throw new Error('Recipe version is required.');
    }
    if (!form.ingredients.length) {
      throw new Error('Please add at least one recipe ingredient.');
    }
    if (form.ingredients.some((item) => !String(item.ingredientId).trim() || !String(item.quantity).trim())) {
      throw new Error('Each recipe ingredient needs ingredient and quantity.');
    }
    if (!form.instructions.length) {
      throw new Error('Please add at least one recipe instruction.');
    }
    if (form.instructions.some((item) => !item.description.trim())) {
      throw new Error('Each recipe instruction needs a description.');
    }
  }

  const invoke = async (entity: EntityType, action: () => Promise<unknown> | unknown) => {
    if (runByEntity) {
      await runByEntity(entity, action);
      return;
    }
    if (run) {
      await run(action);
    }
  };

  if (updateModal.type === 'ingredient') {
    const form = updateModal.form as IngredientUpdateForm;
    await invoke('ingredient', () => api.updateIngredient(updateModal.itemId, buildUpdateIngredientPayload(form)));
  }

  if (updateModal.type === 'food') {
    const form = updateModal.form as FoodUpdateForm;
    await invoke('food', () => api.updateFood(updateModal.itemId, buildUpdateFoodPayload(form)));
  }

  if (updateModal.type === 'recipe') {
    const form = updateModal.form as RecipeUpdateForm;
    await invoke('recipe', () => api.updateRecipe(updateModal.itemId, buildUpdateRecipePayload(form)));
  }
}
