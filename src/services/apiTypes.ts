export interface IdentifiableDto {
  id?: string | number;
  _id?: string | number;
  foodId?: string | number;
  ingredientId?: string | number;
  recipeId?: string | number;
}

export interface FoodRecipeRefDto extends IdentifiableDto {
  name?: string;
}

export interface FoodDto extends IdentifiableDto {
  name?: string;
  category?: string;
  imageUrl?: string;
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
  recipeCount?: number;
  recipes?: FoodRecipeRefDto[];
}

export interface NutritionItemDto {
  nutrient: string;
  value: number | string;
  unit: string;
}

export interface IngredientDto extends IdentifiableDto {
  name?: string;
  category?: string;
  description?: string;
  servingAmount?: number | string;
  servingUnit?: string;
  imageUrl?: string;
  nutritionList?: NutritionItemDto[];
}

export interface RecipeIngredientItemDto {
  ingredientId: string | number;
  ingredientName?: string;
  quantity: number | string;
  unit: string;
  note?: string;
}

export interface RecipeInstructionItemDto {
  step?: number;
  stepNumber?: number;
  description: string;
  tutorialVideoUrl?: string | null;
}

export interface RecipeDto extends IdentifiableDto {
  foodId?: string | number;
  foodName?: string;
  version?: string;
  description?: string;
  ingredients?: RecipeIngredientItemDto[];
  instructions?: RecipeInstructionItemDto[];
}
