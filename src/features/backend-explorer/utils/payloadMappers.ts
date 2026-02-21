import type {
  FoodForm,
  IngredientForm,
  IngredientNutrition,
  IngredientUpdateForm,
  RecipeIngredientItem,
  RecipeInstructionItem,
  RecipeForm,
  RecipeUpdateForm
} from '../types';
import { normalizeNutrientKey } from './nutrients';

export function buildCreateFoodPayload(foodForm: FoodForm) {
  return {
    name: foodForm.name.trim(),
    category: foodForm.category.trim(),
    imageUrl: foodForm.imageUrl.trim() || null,
    recipes: []
  };
}

export function buildCreateIngredientPayload(ingredientForm: IngredientForm, ingredientNutritions: IngredientNutrition[]) {
  return {
    name: ingredientForm.name.trim(),
    category: ingredientForm.category.trim(),
    description: ingredientForm.description.trim(),
    servingAmount: Number(ingredientForm.servingAmount) || 0,
    servingUnit: ingredientForm.servingUnit,
    imageUrl: ingredientForm.imageUrl.trim() || null,
    nutritionList: ingredientNutritions.map((nutrition) => ({
      nutrient: normalizeNutrientKey(nutrition.nutrient),
      value: Number(nutrition.value),
      unit: nutrition.unit
    }))
  };
}

export function buildCreateRecipePayload(
  recipeForm: RecipeForm,
  recipeIngredients: RecipeIngredientItem[],
  recipeInstructions: RecipeInstructionItem[]
) {
  return {
    foodId: Number(recipeForm.foodId),
    version: recipeForm.version.trim(),
    description: recipeForm.description.trim(),
    ingredients: recipeIngredients.map((item) => ({
      ingredientId: Number(item.ingredientId),
      quantity: Number(item.quantity),
      unit: item.unit,
      note: item.note || ''
    })),
    instructions: recipeInstructions.map((item, index) => ({
      step: item.step || index + 1,
      description: item.description.trim(),
      tutorialVideoUrl: item.tutorialVideoUrl ? item.tutorialVideoUrl.trim() : null
    }))
  };
}

export function buildUpdateIngredientPayload(form: IngredientUpdateForm) {
  return {
    name: form.name.trim(),
    category: form.category.trim(),
    description: form.description.trim(),
    servingAmount: Number(form.servingAmount) || 0,
    servingUnit: form.servingUnit,
    imageUrl: form.imageUrl.trim() || null,
    nutritionList: (form.nutritionList || []).map((nutrition) => ({
      nutrient: normalizeNutrientKey(nutrition.nutrient),
      value: Number(nutrition.value),
      unit: nutrition.unit
    }))
  };
}

export function buildUpdateRecipePayload(form: RecipeUpdateForm) {
  return {
    foodId: Number(form.foodId),
    version: form.version.trim(),
    description: form.description.trim(),
    ingredients: (form.ingredients || []).map((item) => ({
      ingredientId: Number(item.ingredientId),
      quantity: Number(item.quantity),
      unit: item.unit,
      note: item.note || ''
    })),
    instructions: (form.instructions || []).map((item, index) => ({
      step: index + 1,
      description: item.description.trim(),
      tutorialVideoUrl: item.tutorialVideoUrl ? item.tutorialVideoUrl.trim() : null
    }))
  };
}
