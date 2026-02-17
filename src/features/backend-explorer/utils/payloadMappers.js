import { normalizeNutrientKey } from './nutrients';

export function buildCreateFoodPayload(foodForm) {
  return {
    name: foodForm.name.trim(),
    category: foodForm.category.trim(),
    imageUrl: foodForm.imageUrl.trim() || null,
    recipes: []
  };
}

export function buildCreateIngredientPayload(ingredientForm, ingredientNutritions) {
  return {
    name: ingredientForm.name.trim(),
    category: ingredientForm.category.trim(),
    description: ingredientForm.description.trim(),
    servingAmount: Number(ingredientForm.servingAmount || 0),
    servingUnit: ingredientForm.servingUnit || 'G',
    imageUrl: ingredientForm.imageUrl.trim() || null,
    nutritionList: ingredientNutritions.map((n) => ({ ...n, nutrient: normalizeNutrientKey(n.nutrient) })),
    nearbyStoreListings: []
  };
}

export function buildCreateRecipePayload(recipeForm, recipeIngredients, recipeInstructions) {
  return {
    version: recipeForm.version.trim(),
    description: recipeForm.description.trim(),
    foodId: Number(recipeForm.foodId),
    ingredients: recipeIngredients.map(({ ingredientId, quantity, unit, note }) => ({
      ingredientId,
      quantity: Number(quantity),
      unit,
      note
    })),
    instructions: recipeInstructions.map((item, index) => ({
      stepNumber: index + 1,
      description: item.description,
      tutorialVideoUrl: item.tutorialVideoUrl
    }))
  };
}

export function buildUpdateIngredientPayload(form) {
  return {
    name: form.name.trim(),
    category: form.category.trim(),
    description: form.description.trim(),
    servingAmount: Number(form.servingAmount || 0),
    servingUnit: form.servingUnit || 'G',
    imageUrl: form.imageUrl.trim() || null,
    nutritionList: form.nutritionList.map((n) => ({
      nutrient: normalizeNutrientKey(n.nutrient),
      value: Number(n.value),
      unit: n.unit
    })),
    nearbyStoreListings: []
  };
}

export function buildUpdateRecipePayload(form) {
  return {
    version: form.version.trim(),
    description: form.description.trim(),
    foodId: Number(form.foodId),
    ingredients: form.ingredients.map((ri) => ({
      ingredientId: Number(ri.ingredientId),
      quantity: Number(ri.quantity),
      unit: ri.unit,
      note: ri.note || ''
    })),
    instructions: form.instructions.map((inst, index) => ({
      stepNumber: index + 1,
      description: inst.description,
      tutorialVideoUrl: inst.tutorialVideoUrl || null
    }))
  };
}
