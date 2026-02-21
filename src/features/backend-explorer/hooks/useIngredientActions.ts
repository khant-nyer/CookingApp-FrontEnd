import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { api } from '../../../services/api';
import type { EntityType, IngredientForm, IngredientNutrition, NutritionDraft } from '../types';
import { normalizeNutrientKey } from '../utils/nutrients';
import { buildCreateIngredientPayload } from '../utils/payloadMappers';

interface UseIngredientActionsParams {
  ingredientForm: IngredientForm;
  setIngredientForm: Dispatch<SetStateAction<IngredientForm>>;
  nutritionDraft: NutritionDraft;
  setNutritionDraft: Dispatch<SetStateAction<NutritionDraft>>;
  ingredientNutritions: IngredientNutrition[];
  setIngredientNutritions: Dispatch<SetStateAction<IngredientNutrition[]>>;
  setCreateError: (message: string) => void;
  setCreateSuccessByType: (type: EntityType, message: string) => void;
  closeCreateModal: () => void;
  setLoading: Dispatch<SetStateAction<boolean>>;
  loadAll: () => Promise<void>;
}

export default function useIngredientActions({
  ingredientForm,
  setIngredientForm,
  nutritionDraft,
  setNutritionDraft,
  ingredientNutritions,
  setIngredientNutritions,
  setCreateError,
  setCreateSuccessByType,
  closeCreateModal,
  setLoading,
  loadAll
}: UseIngredientActionsParams) {
  const addNutrition = useCallback(() => {
    if (!nutritionDraft.value) return setCreateError('Nutrition value is required.');
    setIngredientNutritions((prev) => [
      ...prev,
      {
        nutrient: normalizeNutrientKey(nutritionDraft.nutrient),
        value: Number(nutritionDraft.value),
        unit: nutritionDraft.unit
      }
    ]);
    setNutritionDraft((prev) => ({ ...prev, value: '' }));
  }, [nutritionDraft, setCreateError, setIngredientNutritions, setNutritionDraft]);

  const createIngredient = useCallback(async () => {
    if (!ingredientForm.name.trim()) return setCreateError('Ingredient name is required.');

    setLoading(true);
    setCreateError('');
    try {
      await api.createIngredient(buildCreateIngredientPayload(ingredientForm, ingredientNutritions));
      await loadAll();
      setIngredientForm({ name: '', category: '', description: '', servingAmount: '100', servingUnit: 'G', imageUrl: '' });
      setIngredientNutritions([]);
      setNutritionDraft({ nutrient: 'CALORIES', value: '', unit: 'G' });
      setCreateSuccessByType('ingredient', 'Ingredient created successfully.');
      closeCreateModal();
    } catch (createIngredientError) {
      setCreateError(createIngredientError instanceof Error ? createIngredientError.message : 'Unable to create ingredient.');
    } finally {
      setLoading(false);
    }
  }, [ingredientForm, ingredientNutritions, setCreateError, setLoading, loadAll, setIngredientForm, setIngredientNutritions, setNutritionDraft, setCreateSuccessByType, closeCreateModal]);

  return { addNutrition, createIngredient };
}
