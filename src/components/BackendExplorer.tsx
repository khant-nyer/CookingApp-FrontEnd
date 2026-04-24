import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { unitOptions } from '../features/backend-explorer/constants/units';
import useBackendExplorerController from '../features/backend-explorer/hooks/useBackendExplorerController';
import { getItemId } from '../features/backend-explorer/utils/ids';
import CreateEntityModal from '../features/backend-explorer/modals/CreateEntityModal';
import DeleteConfirmModal from '../features/backend-explorer/modals/DeleteConfirmModal';
import UpdateEntityModal from '../features/backend-explorer/modals/UpdateEntityModal';
import FoodsTab from '../features/backend-explorer/tabs/FoodsTab';
import IngredientsTab from '../features/backend-explorer/tabs/IngredientsTab';
import NutritionTab from '../features/backend-explorer/tabs/NutritionTab';
import RecipesTab from '../features/backend-explorer/tabs/RecipesTab';
import type { EntityType, Food, Ingredient, Recipe, TabKey } from '../features/backend-explorer/types';

interface IconProps {
  className?: string;
}

function ChefHatIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6.8 10.2A4.5 4.5 0 0 1 8 2a5.8 5.8 0 0 1 4 1.7A5.8 5.8 0 0 1 16 2a4.5 4.5 0 0 1 1.2 8.2" /><path d="M4 10h16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z" /><line x1="7" y1="20" x2="17" y2="20" /></svg>;
}

function BowlIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 13h16a8 8 0 0 1-16 0z" /><path d="M9 9c.4-1.3 1.4-2.2 3-2.5" /><path d="M14.5 7c1 .1 1.8.6 2.3 1.6" /><line x1="12" y1="3" x2="12" y2="6" /></svg>;
}

function UtensilsIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 3v7a3 3 0 0 0 3 3v8" /><path d="M7 3v7" /><path d="M10 3v7" /><path d="M15 3l5 5-3 3-5-5" /><path d="M13 11l-3 3" /><path d="M17 14l4 4" /></svg>;
}

function DashboardCard({ title, total, icon }: { title: string; total: number; icon: ReactNode }) {
  return (
    <article className="dashboard-card">
      <div>
        <p className="dashboard-card-title">{title}</p>
        <strong className="dashboard-card-total">{total}</strong>
      </div>
      <span className="dashboard-card-icon" aria-hidden>{icon}</span>
    </article>
  );
}

function pickRecipeTitle(recipe: Recipe) {
  if (recipe.foodName) return recipe.foodName;
  if (recipe.description) return recipe.description.split(/[.!?]/)[0];
  return 'Untitled recipe';
}

function pickRecipeVersion(recipe: Recipe) {
  if (recipe.version && String(recipe.version).trim()) return String(recipe.version).trim();
  return 'N/A';
}

interface BackendExplorerProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
  foodSearchQuery?: string;
  onFoodSearchQueryChange?: (value: string) => void;
  userAllergies?: string[];
}

export default function BackendExplorer({
  isAuthenticated,
  onRequireAuth,
  activeTab: externalActiveTab,
  onTabChange,
  foodSearchQuery,
  onFoodSearchQueryChange,
  userAllergies
}: BackendExplorerProps) {
  const { viewState, createFlow, updateFlow, deleteFlow, entities } = useBackendExplorerController();
  const {
    selectedId,
    setSelectedId,
    selectedNutrient,
    setSelectedNutrient,
    setActiveTab,
    activeTab: controllerActiveTab,
    loadTabData,
    loading,
    error,
    pagination
  } = viewState;

  const handleDeleteCancel = useCallback(() => {
    deleteFlow.setDeleteModal({ open: false, message: '', action: null });
  }, [deleteFlow]);

  const runProtectedAction = useCallback((action: () => void) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    action();
  }, [isAuthenticated, onRequireAuth]);

  const activeTab = externalActiveTab ?? controllerActiveTab;
  const hasSeafoodAllergy = (userAllergies || []).some((allergy) => allergy.trim().toLowerCase() === 'seafood');
  const seafoodWarning = hasSeafoodAllergy ? 'Contains allergens: seafood' : '';

  const handleTabSwitch = useCallback((tab: TabKey) => {
    if (onTabChange) {
      onTabChange(tab);
      return;
    }
    setActiveTab(tab);
  }, [onTabChange, setActiveTab]);

  const foodsTabProps = useMemo(() => ({
    foods: entities.foods,
    selectedId,
    setSelectedId,
    selectedFood: entities.selectedFood,
    createSuccess: createFlow.createSuccess,
    openFoodUpdateModal: (food: Food) => runProtectedAction(() => updateFlow.openFoodUpdateModal(food)),
    getItemId,
    pagination: pagination.foods,
    onPageChange: (page: number) => loadTabData('foods', page),
    loading,
    onDeleteFood: (food: Food) => runProtectedAction(() => deleteFlow.handleDeleteFood(food)),
    onCreateFood: () => runProtectedAction(() => createFlow.openCreateModal('food')),
    searchQuery: foodSearchQuery,
    onSearchQueryChange: onFoodSearchQueryChange,
    allergyWarning: seafoodWarning
  }), [entities.foods, selectedId, setSelectedId, entities.selectedFood, pagination.foods, loadTabData, loading, runProtectedAction, deleteFlow, updateFlow, createFlow, foodSearchQuery, onFoodSearchQueryChange, seafoodWarning]);

  const ingredientsTabProps = useMemo(() => ({
    searchQuery: foodSearchQuery,
    ingredients: entities.ingredients,
    selectedId,
    setSelectedId,
    selectedIngredient: entities.selectedIngredient,
    createSuccess: createFlow.createSuccess,
    openCreateModal: (type: EntityType) => runProtectedAction(() => createFlow.openCreateModal(type)),
    openIngredientUpdateModal: (ingredient: Ingredient) => runProtectedAction(() => updateFlow.openIngredientUpdateModal(ingredient)),
    getItemId,
    pagination: pagination.ingredients,
    onPageChange: (page: number) => loadTabData('ingredients', page),
    loading,
    onDeleteIngredient: (ingredient: Ingredient) => runProtectedAction(() => deleteFlow.handleDeleteIngredient(ingredient)),
    allergyWarning: seafoodWarning
  }), [foodSearchQuery, entities.ingredients, selectedId, setSelectedId, entities.selectedIngredient, createFlow, pagination.ingredients, loadTabData, loading, runProtectedAction, deleteFlow, updateFlow, seafoodWarning]);

  const recipesTabProps = useMemo(() => ({
    searchQuery: foodSearchQuery,
    recipes: entities.recipes,
    foods: entities.foods,
    selectedId,
    setSelectedId,
    selectedRecipe: entities.selectedRecipe,
    createSuccess: createFlow.createSuccess,
    openCreateModal: (type: EntityType) => runProtectedAction(() => createFlow.openCreateModal(type)),
    openRecipeUpdateModal: (recipe: Recipe) => runProtectedAction(() => updateFlow.openRecipeUpdateModal(recipe)),
    pagination: pagination.recipes,
    onPageChange: (page: number) => loadTabData('recipes', page),
    loading,
    onDeleteRecipe: (recipe: Recipe) => runProtectedAction(() => deleteFlow.handleDeleteRecipe(recipe)),
    allergyWarning: seafoodWarning
  }), [foodSearchQuery, entities.recipes, entities.foods, selectedId, setSelectedId, entities.selectedRecipe, createFlow, pagination.recipes, loadTabData, loading, runProtectedAction, deleteFlow, updateFlow, seafoodWarning]);

  const nutritionTabProps = useMemo(() => ({
    searchQuery: foodSearchQuery,
    selectedNutrient,
    setSelectedNutrient,
    nutrientFilteredIngredients: entities.nutrientFilteredIngredients,
    setActiveTab: handleTabSwitch,
    getItemId
  }), [foodSearchQuery, selectedNutrient, setSelectedNutrient, entities.nutrientFilteredIngredients, handleTabSwitch]);

  const totalFoods = pagination.foods.totalElements || entities.foods.length;
  const totalIngredients = pagination.ingredients.totalElements || entities.ingredients.length;
  const totalRecipes = pagination.recipes.totalElements || entities.recipes.length;

  const recentRecipes = entities.recipes.slice(0, 4);
  const latestFoods = entities.foods.slice(0, 4);
  const searchPlaceholder = activeTab === 'foods'
    ? 'Search foods by name, category, or creator'
    : activeTab === 'ingredients'
      ? 'Search ingredients by name, category, or description'
      : activeTab === 'recipes'
        ? 'Search recipes by food, version, or description'
        : 'Search nutrient ingredients by name or category';

  return (
    <section className="backend-explorer-scroll">
      {activeTab !== 'dashboard' ? (
        <div className="explorer-search-row">
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={foodSearchQuery || ''}
            onChange={(event) => onFoodSearchQueryChange?.(event.target.value)}
            aria-label={searchPlaceholder}
          />
        </div>
      ) : null}
      {error && <p className="error">{error}</p>}

      {activeTab === 'dashboard' ? (
        <section className="dashboard-layout">
          <p className="development-notice"><strong>This application is still under development, update is coming soon.</strong></p>
          <div className="dashboard-cards">
            <DashboardCard title="Total Foods" total={totalFoods} icon={<BowlIcon className="icon" />} />
            <DashboardCard title="Ingredients" total={totalIngredients} icon={<UtensilsIcon className="icon" />} />
            <DashboardCard title="Recipes" total={totalRecipes} icon={<ChefHatIcon className="icon" />} />
          </div>

          <div className="dashboard-lists">
            <article className="dashboard-list-card">
              <h3>Recent Recipes</h3>
              <ul>
                {recentRecipes.map((recipe) => (
                  <li key={String(getItemId(recipe))}>
                    <span className="dashboard-list-icon" aria-hidden>
                      <ChefHatIcon className="icon" />
                    </span>
                    <div>
                      <strong>{pickRecipeTitle(recipe)}</strong>
                      <span>{recipe.description || 'No description available'}</span>
                    </div>
                    <strong className="recipe-version-badge">{pickRecipeVersion(recipe)}</strong>
                  </li>
                ))}
                {!recentRecipes.length && <li>No recipes yet.</li>}
              </ul>
            </article>

            <article className="dashboard-list-card">
              <h3>Latest Foods</h3>
              <ul>
                {latestFoods.map((food) => (
                  <li key={String(getItemId(food))}>
                    <img
                      src={food.imageUrl || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=120&q=60'}
                      alt={food.name || 'Food image'}
                    />
                    <div>
                      <strong>{food.name || 'Unnamed food'}</strong>
                      <span>{food.category || 'No category'}</span>
                    </div>
                  </li>
                ))}
                {!latestFoods.length && <li>No foods yet.</li>}
              </ul>
            </article>
          </div>
        </section>
      ) : null}

      {activeTab === 'foods' && <FoodsTab {...foodsTabProps} />}

      {activeTab === 'ingredients' && <IngredientsTab {...ingredientsTabProps} />}

      {activeTab === 'recipes' && <RecipesTab {...recipesTabProps} />}

      {activeTab === 'nutrition' && <NutritionTab {...nutritionTabProps} />}

      <CreateEntityModal
        createModal={createFlow.createModal}
        createError={createFlow.createError}
        closeCreateModal={createFlow.closeCreateModal}
        createFood={createFlow.createFood}
        createIngredient={createFlow.createIngredient}
        createRecipe={createFlow.createRecipe}
        foodForm={createFlow.foodForm}
        setFoodForm={createFlow.setFoodForm}
        ingredientForm={createFlow.ingredientForm}
        setIngredientForm={createFlow.setIngredientForm}
        ingredientNutritions={createFlow.ingredientNutritions}
        setIngredientNutritions={createFlow.setIngredientNutritions}
        nutritionDraft={createFlow.nutritionDraft}
        setNutritionDraft={createFlow.setNutritionDraft}
        unitOptions={unitOptions}
        addNutrition={createFlow.addNutrition}
        recipeForm={createFlow.recipeForm}
        setRecipeForm={createFlow.setRecipeForm}
        foods={entities.foods}
        getItemId={getItemId}
        recipeIngredients={createFlow.recipeIngredients}
        setRecipeIngredients={createFlow.setRecipeIngredients}
        ingredients={entities.ingredients}
        recipeIngredientDraft={createFlow.recipeIngredientDraft}
        setRecipeIngredientDraft={createFlow.setRecipeIngredientDraft}
        addRecipeIngredient={createFlow.addRecipeIngredient}
        recipeInstructionDraft={createFlow.recipeInstructionDraft}
        setRecipeInstructionDraft={createFlow.setRecipeInstructionDraft}
        addRecipeInstruction={createFlow.addRecipeInstruction}
        recipeInstructions={createFlow.recipeInstructions}
        setRecipeInstructions={createFlow.setRecipeInstructions}
      />

      <DeleteConfirmModal
        deleteModal={deleteFlow.deleteModal}
        errorMessage={deleteFlow.deleteError}
        onCancel={handleDeleteCancel}
        onConfirm={deleteFlow.confirmDelete}
      />

      <UpdateEntityModal
        updateModal={updateFlow.updateModal}
        errorMessage={updateFlow.updateError}
        setUpdateModal={updateFlow.setUpdateModal}
        unitOptions={unitOptions}
        foods={entities.foods}
        ingredients={entities.ingredients}
        getItemId={getItemId}
        updateNutritionDraft={updateFlow.updateNutritionDraft}
        setUpdateNutritionDraft={updateFlow.setUpdateNutritionDraft}
        addUpdateNutrition={updateFlow.addUpdateNutrition}
        confirmUpdate={updateFlow.confirmUpdate}
      />
    </section>
  );
}
