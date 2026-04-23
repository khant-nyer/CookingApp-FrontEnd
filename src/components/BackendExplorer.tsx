import { useCallback, useMemo } from 'react';
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


function DashboardCard({ title, total, tone }: { title: string; total: number; tone: 'green' | 'amber' | 'orange' }) {
  return (
    <article className={`dashboard-card tone-${tone}`}>
      <div>
        <p className="dashboard-card-title">{title}</p>
        <strong className="dashboard-card-total">{total}</strong>
      </div>
    </article>
  );
}

function pickRecipeTitle(recipe: Recipe) {
  if (recipe.foodName) return recipe.foodName;
  if (recipe.description) return recipe.description.split(/[.!?]/)[0];
  return 'Untitled recipe';
}

interface BackendExplorerProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
}

export default function BackendExplorer({ isAuthenticated, onRequireAuth, activeTab: externalActiveTab, onTabChange }: BackendExplorerProps) {
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

  const handleRefreshTab = useCallback(() => {
    void loadTabData(activeTab);
  }, [activeTab, loadTabData]);

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
    openCreateModal: (type: EntityType) => runProtectedAction(() => createFlow.openCreateModal(type)),
    openFoodUpdateModal: (food: Food) => runProtectedAction(() => updateFlow.openFoodUpdateModal(food)),
    getItemId,
    pagination: pagination.foods,
    onPageChange: (page: number) => loadTabData('foods', page),
    loading,
    onDeleteFood: (food: Food) => runProtectedAction(() => deleteFlow.handleDeleteFood(food))
  }), [entities.foods, selectedId, setSelectedId, entities.selectedFood, createFlow, pagination.foods, loadTabData, loading, runProtectedAction, deleteFlow, updateFlow]);

  const ingredientsTabProps = useMemo(() => ({
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
    onDeleteIngredient: (ingredient: Ingredient) => runProtectedAction(() => deleteFlow.handleDeleteIngredient(ingredient))
  }), [entities.ingredients, selectedId, setSelectedId, entities.selectedIngredient, createFlow, pagination.ingredients, loadTabData, loading, runProtectedAction, deleteFlow, updateFlow]);

  const recipesTabProps = useMemo(() => ({
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
    onDeleteRecipe: (recipe: Recipe) => runProtectedAction(() => deleteFlow.handleDeleteRecipe(recipe))
  }), [entities.recipes, entities.foods, selectedId, setSelectedId, entities.selectedRecipe, createFlow, pagination.recipes, loadTabData, loading, runProtectedAction, deleteFlow, updateFlow]);

  const nutritionTabProps = useMemo(() => ({
    selectedNutrient,
    setSelectedNutrient,
    nutrientFilteredIngredients: entities.nutrientFilteredIngredients,
    setActiveTab: handleTabSwitch,
    getItemId
  }), [selectedNutrient, setSelectedNutrient, entities.nutrientFilteredIngredients, handleTabSwitch]);

  const totalFoods = pagination.foods.totalElements || entities.foods.length;
  const totalIngredients = pagination.ingredients.totalElements || entities.ingredients.length;
  const totalRecipes = pagination.recipes.totalElements || entities.recipes.length;

  const recentRecipes = entities.recipes.slice(0, 4);
  const latestFoods = entities.foods.slice(0, 4);

  return (
    <section>
      <div className="content-toolbar">
        <button onClick={handleRefreshTab}>{loading ? 'Loading…' : 'Refresh tab'}</button>
      </div>

      {!isAuthenticated && <p className="muted guest-dev-notice">This application is still under development, updates coming soon.</p>}
      {error && <p className="error">{error}</p>}

      {activeTab === 'dashboard' ? (
        <section className="dashboard-layout">
          <div className="dashboard-cards">
            <DashboardCard title="Total Foods" total={totalFoods} tone="green" />
            <DashboardCard title="Ingredients" total={totalIngredients} tone="amber" />
            <DashboardCard title="Recipes" total={totalRecipes} tone="orange" />
          </div>

          <div className="dashboard-lists">
            <article className="dashboard-list-card">
              <h3>Recent Recipes</h3>
              <ul>
                {recentRecipes.map((recipe) => (
                  <li key={String(getItemId(recipe))}>
                    <strong>{pickRecipeTitle(recipe)}</strong>
                    <span>{recipe.description || 'No description available'}</span>
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
                    <strong>{food.name || 'Unnamed food'}</strong>
                    <span>{food.category || 'No category'}</span>
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
