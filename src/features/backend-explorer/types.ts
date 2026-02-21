export type EntityType = 'food' | 'ingredient' | 'recipe';

export type Updater<T> = T | ((prev: T) => T);

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

export interface NutritionDraft {
  nutrient: string;
  value: string;
  unit: string;
}

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
