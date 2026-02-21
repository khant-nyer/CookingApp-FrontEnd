import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { api } from '../../../services/api';
import type {
  EntityType,
  Ingredient,
  RecipeForm,
  RecipeIngredientDraft,
  RecipeIngredientItem,
  RecipeInstructionDraft,
  RecipeInstructionItem
} from '../types';
import { getItemId } from '../utils/ids';
import { buildCreateRecipePayload } from '../utils/payloadMappers';

interface UseRecipeActionsParams {
  ingredients: Ingredient[];
  recipeForm: RecipeForm;
  setRecipeForm: Dispatch<SetStateAction<RecipeForm>>;
  recipeIngredientDraft: RecipeIngredientDraft;
  setRecipeIngredientDraft: Dispatch<SetStateAction<RecipeIngredientDraft>>;
  recipeInstructionDraft: RecipeInstructionDraft;
  setRecipeInstructionDraft: Dispatch<SetStateAction<RecipeInstructionDraft>>;
  recipeIngredients: RecipeIngredientItem[];
  setRecipeIngredients: Dispatch<SetStateAction<RecipeIngredientItem[]>>;
  recipeInstructions: RecipeInstructionItem[];
  setRecipeInstructions: Dispatch<SetStateAction<RecipeInstructionItem[]>>;
  setCreateError: (message: string) => void;
  setCreateSuccessByType: (type: EntityType, message: string) => void;
  closeCreateModal: () => void;
  setLoading: Dispatch<SetStateAction<boolean>>;
  loadAll: () => Promise<void>;
}

export default function useRecipeActions({
  ingredients,
  recipeForm,
  setRecipeForm,
  recipeIngredientDraft,
  setRecipeIngredientDraft,
  recipeInstructionDraft,
  setRecipeInstructionDraft,
  recipeIngredients,
  setRecipeIngredients,
  recipeInstructions,
  setRecipeInstructions,
  setCreateError,
  setCreateSuccessByType,
  closeCreateModal,
  setLoading,
  loadAll
}: UseRecipeActionsParams) {
  const addRecipeIngredient = useCallback(() => {
    if (!recipeIngredientDraft.ingredientId || !recipeIngredientDraft.quantity) {
      return setCreateError('Recipe ingredient needs ingredient and quantity.');
    }

    const ingredientId = Number(recipeIngredientDraft.ingredientId);
    setRecipeIngredients((prev) => [
      ...prev,
      {
        ingredientId,
        ingredientName: ingredients.find((item) => String(getItemId(item)) === String(ingredientId))?.name || '',
        quantity: Number(recipeIngredientDraft.quantity),
        unit: recipeIngredientDraft.unit || 'G',
        note: recipeIngredientDraft.note || ''
      }
    ]);
    setRecipeIngredientDraft({ ingredientId: '', quantity: '', unit: 'G', note: '' });
  }, [recipeIngredientDraft, ingredients, setCreateError, setRecipeIngredients, setRecipeIngredientDraft]);

  const addRecipeInstruction = useCallback(() => {
    if (!recipeInstructionDraft.description.trim()) return setCreateError('Instruction description is required.');
    setRecipeInstructions((prev) => [
      ...prev,
      {
        step: prev.length + 1,
        description: recipeInstructionDraft.description.trim(),
        tutorialVideoUrl: recipeInstructionDraft.tutorialVideoUrl.trim() || null
      }
    ]);
    setRecipeInstructionDraft({ description: '', tutorialVideoUrl: '' });
  }, [recipeInstructionDraft, setCreateError, setRecipeInstructions, setRecipeInstructionDraft]);

  const createRecipe = useCallback(async () => {
    if (!recipeForm.foodId) return setCreateError('Please select food for recipe.');
    if (!recipeForm.version.trim()) return setCreateError('Recipe version is required.');
    if (!recipeIngredients.length) return setCreateError('Please add at least one recipe ingredient.');
    if (!recipeInstructions.length) return setCreateError('Please add at least one recipe instruction.');

    setLoading(true);
    setCreateError('');
    try {
      await api.createRecipeForFoodViaRecipeApi(recipeForm.foodId, buildCreateRecipePayload(recipeForm, recipeIngredients, recipeInstructions));
      await loadAll();
      setRecipeForm({ foodId: '', version: 'v1', description: '' });
      setRecipeIngredients([]);
      setRecipeInstructions([]);
      setCreateSuccessByType('recipe', 'Recipe created successfully.');
      closeCreateModal();
    } catch (createRecipeError) {
      setCreateError(createRecipeError instanceof Error ? createRecipeError.message : 'Unable to create recipe.');
    } finally {
      setLoading(false);
    }
  }, [recipeForm, recipeIngredients, recipeInstructions, setCreateError, setLoading, loadAll, setRecipeForm, setRecipeIngredients, setRecipeInstructions, setCreateSuccessByType, closeCreateModal]);

  return {
    addRecipeIngredient,
    addRecipeInstruction,
    createRecipe
  };
}
