import { useReducer, useState } from 'react';
import useFoodActions from './useFoodActions';
import useIngredientActions from './useIngredientActions';
import useRecipeActions from './useRecipeActions';
import { createFlowReducer, initialCreateFlowState } from '../reducers/createFlowReducer';
import type {
  EntityType,
  FoodForm,
  Ingredient,
  IngredientForm,
  IngredientNutrition,
  NutritionDraft,
  RecipeForm,
  RecipeIngredientDraft,
  RecipeIngredientItem,
  RecipeInstructionDraft,
  RecipeInstructionItem,
  StateSetter
} from '../types';

interface Params {
  ingredients: Ingredient[];
  setLoading: StateSetter<boolean>;
  loadAll: () => Promise<void>;
}

export default function useExplorerCreateFlow({ ingredients, setLoading, loadAll }: Params) {
  const [foodForm, setFoodForm] = useState<FoodForm>({ name: '', category: '', imageUrl: '' });
  const [ingredientForm, setIngredientForm] = useState<IngredientForm>({ name: '', category: '', description: '', servingAmount: '100', servingUnit: 'G', imageUrl: '' });
  const [nutritionDraft, setNutritionDraft] = useState<NutritionDraft>({ nutrient: 'CALORIES', value: '', unit: 'G' });
  const [ingredientNutritions, setIngredientNutritions] = useState<IngredientNutrition[]>([]);
  const [recipeForm, setRecipeForm] = useState<RecipeForm>({ foodId: '', version: 'v1', description: '' });
  const [recipeIngredientDraft, setRecipeIngredientDraft] = useState<RecipeIngredientDraft>({ ingredientId: '', quantity: '', unit: 'G', note: '' });
  const [recipeInstructionDraft, setRecipeInstructionDraft] = useState<RecipeInstructionDraft>({ description: '', tutorialVideoUrl: '' });
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientItem[]>([]);
  const [recipeInstructions, setRecipeInstructions] = useState<RecipeInstructionItem[]>([]);

  const [createFlowState, dispatchCreateFlow] = useReducer(createFlowReducer, initialCreateFlowState);
  const { createModal, createError, createSuccess } = createFlowState;

  function openCreateModal(type: EntityType) {
    dispatchCreateFlow({ type: 'open_create_modal', entityType: type });
  }

  function closeCreateModal() {
    dispatchCreateFlow({ type: 'close_create_modal' });
  }

  function setCreateSuccessByType(type: EntityType, message: string) {
    dispatchCreateFlow({ type: 'set_create_success', entityType: type, message });
  }

  function setCreateError(message: string) {
    dispatchCreateFlow({ type: 'set_create_error', message });
  }

  const { createFood } = useFoodActions({
    foodForm,
    setFoodForm,
    setCreateError,
    setCreateSuccessByType,
    closeCreateModal,
    setLoading,
    loadAll
  });

  const { addNutrition, createIngredient } = useIngredientActions({
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
  });

  const { addRecipeIngredient, addRecipeInstruction, createRecipe } = useRecipeActions({
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
  });

  return {
    createModal,
    createError,
    createSuccess,
    openCreateModal,
    closeCreateModal,
    createFood,
    createIngredient,
    createRecipe,
    foodForm,
    setFoodForm,
    ingredientForm,
    setIngredientForm,
    ingredientNutritions,
    setIngredientNutritions,
    nutritionDraft,
    setNutritionDraft,
    addNutrition,
    recipeForm,
    setRecipeForm,
    recipeIngredients,
    setRecipeIngredients,
    recipeIngredientDraft,
    setRecipeIngredientDraft,
    addRecipeIngredient,
    recipeInstructionDraft,
    setRecipeInstructionDraft,
    addRecipeInstruction,
    recipeInstructions,
    setRecipeInstructions
  };
}
