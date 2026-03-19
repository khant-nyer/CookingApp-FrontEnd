import type { ChangeEvent, Dispatch, KeyboardEvent, SetStateAction } from 'react';
import type { FoodDto, IngredientDto, RecipeDto } from '../../services/apiTypes';

export type EntityType = 'food' | 'ingredient' | 'recipe';
export type TabKey = 'foods' | 'ingredients' | 'recipes' | 'nutrition';

export type Nullable<T> = T | null;
export type Updater<T> = T | ((prev: T) => T);
export type StateSetter<T> = Dispatch<SetStateAction<T>>;
export type InputChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
export type InputKeyboardEvent = KeyboardEvent<HTMLInputElement>;

export interface PaginationInfo {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}

export interface PaginationState {
  foods: PaginationInfo;
  ingredients: PaginationInfo;
  recipes: PaginationInfo;
}


export interface Identifiable {
  id?: string | number;
  _id?: string | number;
}

export interface FoodRecipeRef {
  id?: string | number;
  name?: string;
}

export type Food = FoodDto;

export interface NutritionItem {
  nutrient: string;
  value: number | string;
  unit: string;
}

export type Ingredient = IngredientDto;

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

export type Recipe = RecipeDto;

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


export interface BackendExplorerViewState {
  activeTab: TabKey;
  setActiveTab: StateSetter<TabKey>;
  selectedId: string;
  setSelectedId: StateSetter<string>;
  selectedNutrient: string;
  setSelectedNutrient: StateSetter<string>;
  error: string;
  loading: boolean;
  loadAll: () => Promise<void>;
  pagination: PaginationState;
  loadTabData: (tab: TabKey, page?: number) => Promise<void>;
}

export interface BackendExplorerCreateFlow {
  createModal: CreateModalState;
  createError: string;
  createSuccess: CreateSuccessState;
  openCreateModal: (type: EntityType) => void;
  closeCreateModal: () => void;
  createFood: () => Promise<void>;
  createIngredient: () => Promise<void>;
  createRecipe: () => Promise<void>;
  foodForm: FoodForm;
  setFoodForm: StateSetter<FoodForm>;
  ingredientForm: IngredientForm;
  setIngredientForm: StateSetter<IngredientForm>;
  ingredientNutritions: IngredientNutrition[];
  setIngredientNutritions: StateSetter<IngredientNutrition[]>;
  nutritionDraft: NutritionDraft;
  setNutritionDraft: StateSetter<NutritionDraft>;
  addNutrition: () => void;
  recipeForm: RecipeForm;
  setRecipeForm: StateSetter<RecipeForm>;
  recipeIngredients: RecipeIngredientItem[];
  setRecipeIngredients: StateSetter<RecipeIngredientItem[]>;
  recipeIngredientDraft: RecipeIngredientDraft;
  setRecipeIngredientDraft: StateSetter<RecipeIngredientDraft>;
  addRecipeIngredient: () => void;
  recipeInstructionDraft: RecipeInstructionDraft;
  setRecipeInstructionDraft: StateSetter<RecipeInstructionDraft>;
  addRecipeInstruction: () => void;
  recipeInstructions: RecipeInstructionItem[];
  setRecipeInstructions: StateSetter<RecipeInstructionItem[]>;
}

export interface BackendExplorerUpdateFlow {
  updateModal: UpdateModalState;
  setUpdateModal: (value: Updater<UpdateModalState>) => void;
  updateNutritionDraft: NutritionDraft;
  setUpdateNutritionDraft: (value: Updater<NutritionDraft>) => void;
  addUpdateNutrition: () => void;
  openIngredientUpdateModal: (item: Ingredient) => void;
  openRecipeUpdateModal: (item: Recipe) => void;
  confirmUpdate: () => Promise<void>;
}

export interface BackendExplorerDeleteFlow {
  deleteModal: DeleteModalState;
  setDeleteModal: (value: Updater<DeleteModalState>) => void;
  confirmDelete: () => Promise<void>;
  handleDeleteFood: (food: { id?: string | number; _id?: string | number }) => void;
  handleDeleteIngredient: (ingredient: Ingredient) => void;
  handleDeleteRecipe: (recipe: Recipe) => void;
}

export interface BackendExplorerEntities {
  foods: Food[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  selectedFood: Food | undefined;
  selectedIngredient: Ingredient | undefined;
  selectedRecipe: Recipe | undefined;
  nutrientFilteredIngredients: Ingredient[];
}

export interface BackendExplorerController {
  viewState: BackendExplorerViewState;
  createFlow: BackendExplorerCreateFlow;
  updateFlow: BackendExplorerUpdateFlow;
  deleteFlow: BackendExplorerDeleteFlow;
  entities: BackendExplorerEntities;
}
