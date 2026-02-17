import { useCallback } from 'react';
import { api } from '../../../services/api';
import { normalizeNutrientKey } from '../utils/nutrients';
import { buildCreateIngredientPayload } from '../utils/payloadMappers';

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
}) {
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
      setCreateError(createIngredientError.message);
    } finally {
      setLoading(false);
    }
  }, [ingredientForm, ingredientNutritions, setCreateError, setLoading, loadAll, setIngredientForm, setIngredientNutritions, setNutritionDraft, setCreateSuccessByType, closeCreateModal]);

  return { addNutrition, createIngredient };
}
