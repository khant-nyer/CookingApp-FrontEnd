import { describe, expect, it, vi } from 'vitest';
import { api } from '../../../services/api';
import {
  appendUpdateNutritionToForm,
  executeDeleteConfirmation,
  executeUpdateConfirmation,
  getSelectedIdForTabChange
} from './useBackendExplorerController';

describe('useBackendExplorerController helpers', () => {
  it('returns empty selected id on tab change', () => {
    expect(getSelectedIdForTabChange()).toBe('');
  });

  it('appends normalized nutrition entry for update form', () => {
    const next = appendUpdateNutritionToForm(
      {
        name: 'Salt',
        category: 'Spices',
        description: '',
        servingAmount: '100',
        servingUnit: 'G',
        imageUrl: '',
        nutritionList: []
      },
      { nutrient: 'total sugars', value: '2', unit: 'g' }
    );

    expect(next?.nutritionList).toEqual([{ nutrient: 'SUGARS', value: 2, unit: 'g' }]);
  });

  it('returns null for invalid nutrition draft value', () => {
    const next = appendUpdateNutritionToForm(
      {
        name: 'Salt',
        category: 'Spices',
        description: '',
        servingAmount: '100',
        servingUnit: 'G',
        imageUrl: '',
        nutritionList: []
      },
      { nutrient: 'CALORIES', value: 'bad-number', unit: 'g' }
    );

    expect(next).toBeNull();
  });

  it('executes delete action once and closes modal', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const run = vi.fn(async (fn: () => Promise<unknown> | unknown) => { await fn(); });
    const setDeleteModal = vi.fn();

    await executeDeleteConfirmation({
      deleteModal: { open: true, message: 'Delete?', action },
      run,
      setDeleteModal
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(setDeleteModal).toHaveBeenCalledWith({ open: false, message: '', action: null });
  });

  it('dispatches correct API update method by modal type', async () => {
    const run = vi.fn(async (fn: () => Promise<unknown> | unknown) => { await fn(); });

    const updateIngredientSpy = vi.spyOn(api, 'updateIngredient').mockResolvedValue({ ok: true } as never);
    const updateRecipeSpy = vi.spyOn(api, 'updateRecipe').mockResolvedValue({ ok: true } as never);

    await executeUpdateConfirmation({
      updateModal: {
        open: true,
        type: 'ingredient',
        title: 'Update Ingredient',
        itemId: 'ingredient-1',
        form: {
          name: 'Sugar',
          category: 'Sweetener',
          description: '',
          servingAmount: '100',
          servingUnit: 'G',
          imageUrl: '',
          nutritionList: []
        }
      },
      run
    });

    await executeUpdateConfirmation({
      updateModal: {
        open: true,
        type: 'recipe',
        title: 'Update Recipe',
        itemId: 'recipe-1',
        form: {
          foodId: 'food-1',
          version: 'v2',
          description: 'Updated',
          ingredients: [],
          instructions: []
        }
      },
      run
    });

    expect(updateIngredientSpy).toHaveBeenCalledTimes(1);
    expect(updateRecipeSpy).toHaveBeenCalledTimes(1);
  });
});
