import { describe, expect, it, vi } from 'vitest';
import { api } from '../../../../src/services/api';
import {
  appendUpdateNutritionToForm,
  executeDeleteConfirmation,
  executeUpdateConfirmation
} from '../../../../src/features/backend-explorer/hooks/useBackendExplorerController';

describe('useBackendExplorerController helpers', () => {

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


  it('closes delete modal safely when no action is provided', async () => {
    const run = vi.fn();
    const setDeleteModal = vi.fn();

    await executeDeleteConfirmation({
      deleteModal: { open: true, message: 'Delete?', action: null },
      run,
      setDeleteModal
    });

    expect(run).not.toHaveBeenCalled();
    expect(setDeleteModal).toHaveBeenCalledWith({ open: false, message: '', action: null });
  });

  it('does not call update APIs for empty update modal type', async () => {
    const run = vi.fn(async (fn: () => Promise<unknown> | unknown) => { await fn(); });
    const updateFoodSpy = vi.spyOn(api, 'updateFood').mockResolvedValue({ ok: true } as never);
    const updateIngredientSpy = vi.spyOn(api, 'updateIngredient').mockResolvedValue({ ok: true } as never);
    const updateRecipeSpy = vi.spyOn(api, 'updateRecipe').mockResolvedValue({ ok: true } as never);

    await executeUpdateConfirmation({
      updateModal: { open: false, type: '', title: '', itemId: null, form: null },
      run
    });

    expect(run).not.toHaveBeenCalled();
    expect(updateFoodSpy).not.toHaveBeenCalled();
    expect(updateIngredientSpy).not.toHaveBeenCalled();
    expect(updateRecipeSpy).not.toHaveBeenCalled();
  });

  it('dispatches correct API update method by modal type', async () => {
    const run = vi.fn(async (fn: () => Promise<unknown> | unknown) => { await fn(); });

    const updateFoodSpy = vi.spyOn(api, 'updateFood').mockResolvedValue({ ok: true } as never);
    const updateIngredientSpy = vi.spyOn(api, 'updateIngredient').mockResolvedValue({ ok: true } as never);
    const updateRecipeSpy = vi.spyOn(api, 'updateRecipe').mockResolvedValue({ ok: true } as never);

    await executeUpdateConfirmation({
      updateModal: {
        open: true,
        type: 'food',
        title: 'Update Food',
        itemId: 'food-1',
        form: {
          name: 'Rice',
          category: 'Grains',
          imageUrl: ''
        }
      },
      run
    });

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

    expect(updateFoodSpy).toHaveBeenCalledTimes(1);
    expect(updateIngredientSpy).toHaveBeenCalledTimes(1);
    expect(updateRecipeSpy).toHaveBeenCalledTimes(1);
  });
});
