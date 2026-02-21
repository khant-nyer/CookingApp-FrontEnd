import type { Dispatch, SetStateAction } from 'react';

export type EntityType = 'food' | 'ingredient' | 'recipe';
export type TabKey = 'foods' | 'ingredients' | 'recipes' | 'nutrition';

export type Nullable<T> = T | null;
export type Updater<T> = T | ((prev: T) => T);
export type StateSetter<T> = Dispatch<SetStateAction<T>>;

export interface Identifiable {
  id?: string | number;
  _id?: string | number;
}

export interface FoodRecipeRef {
  id?: string | number;
  name?: string;
}

export interface Food extends Identifiable {
  name?: string;
  category?: string;
  imageUrl?: string;
  recipes?: FoodRecipeRef[];
}

export interface NutritionItem {
  nutrient: string;
  value: number | string;
  unit: string;
}

export interface Ingredient extends Identifiable {
  name?: string;
  category?: string;
  description?: string;
  servingAmount?: number | string;
  servingUnit?: string;
  imageUrl?: string;
  nutritionList?: NutritionItem[];
}

export interface RecipeIngredientItem {
  ingredientId: string | number;
  ingredientName?: string;
  quantity: number | string;
  unit: string;
  note?: string;
}

export interface RecipeInstructionItem {
  step?: number;
  stepNumber?: number;
  description: string;
  tutorialVideoUrl?: string | null;
}

export interface Recipe extends Identifiable {
  foodId?: string | number;
  foodName?: string;
  version?: string;
  description?: string;
  ingredients?: RecipeIngredientItem[];
  instructions?: RecipeInstructionItem[];
}

export interface FoodForm {
  name: string;
  category: string;
  imageUrl: string;
}

export interface IngredientForm {
  name: string;
  category: string;
  description: string;
  servingAmount: string;
  servingUnit: string;
  imageUrl: string;
}

export interface NutritionDraft {
  nutrient: string;
  value: string;
  unit: string;
}

export interface RecipeForm {
  foodId: string;
  version: string;
  description: string;
}

export interface RecipeIngredientDraft {
  ingredientId: string;
  quantity: string;
  unit: string;
  note: string;
}

export interface RecipeInstructionDraft {
  description: string;
  tutorialVideoUrl: string;
}

export interface CreateModalState {
  open: boolean;
  type: '' | EntityType;
}

export interface CreateSuccessState {
  food: string;
  ingredient: string;
  recipe: string;
}

export interface CreateFlowState {
  createModal: CreateModalState;
  createError: string;
  createSuccess: CreateSuccessState;
}

export type CreateFlowAction =
  | { type: 'open_create_modal'; entityType: EntityType }
  | { type: 'close_create_modal' }
  | { type: 'set_create_error'; message?: string }
  | { type: 'set_create_success'; entityType: EntityType; message?: string };

export interface DeleteModalState {
  open: boolean;
  message: string;
  action: null | (() => Promise<unknown>) | (() => unknown);
}

export interface IngredientNutrition {
  nutrient: string;
  value: string | number;
  unit: string;
}

export interface IngredientUpdateForm {
  name: string;
  category: string;
  description: string;
  servingAmount: string;
  servingUnit: string;
  imageUrl: string;
  nutritionList: IngredientNutrition[];
}

export interface RecipeIngredientFormItem {
  ingredientId: string;
  quantity: string;
  unit: string;
  note: string;
}

export interface RecipeInstructionFormItem {
  description: string;
  tutorialVideoUrl: string;
}

export interface RecipeUpdateForm {
  foodId: string;
  version: string;
  description: string;
  ingredients: RecipeIngredientFormItem[];
  instructions: RecipeInstructionFormItem[];
}

export interface UpdateModalState {
  open: boolean;
  type: '' | 'ingredient' | 'recipe';
  title: string;
  itemId: string | number | null;
  form: IngredientUpdateForm | RecipeUpdateForm | null;
}

export interface UpdateFlowState {
  updateNutritionDraft: NutritionDraft;
  deleteModal: DeleteModalState;
  updateModal: UpdateModalState;
}

export type UpdateFlowAction =
  | { type: 'set_update_nutrition_draft'; value: Updater<NutritionDraft> }
  | { type: 'set_delete_modal'; value: Updater<DeleteModalState> }
  | { type: 'set_update_modal'; value: Updater<UpdateModalState> };
