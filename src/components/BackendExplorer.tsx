import { useCallback, useMemo, useState } from 'react';
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
import type { TabKey } from '../features/backend-explorer/types';

const tabs: TabKey[] = ['foods', 'ingredients', 'recipes', 'nutrition'];

interface BackendExplorerProps {
  userEmail?: string;
  onLogout: () => void;
}

export default function BackendExplorer({ userEmail, onLogout }: BackendExplorerProps) {
  const { viewState, createFlow, updateFlow, deleteFlow, entities } = useBackendExplorerController();
  const {
    selectedId,
    setSelectedId,
    selectedNutrient,
    setSelectedNutrient,
    setActiveTab,
    activeTab,
    loadTabData,
    loading,
    error,
    pagination
  } = viewState;
  const [selectedSection, setSelectedSection] = useState<'dashboard' | TabKey>('dashboard');

  const handleDeleteCancel = useCallback(() => {
    deleteFlow.setDeleteModal({ open: false, message: '', action: null });
  }, [deleteFlow]);

  const foodsTabProps = useMemo(() => ({
    foods: entities.foods,
    selectedId,
    setSelectedId,
    selectedFood: entities.selectedFood,
    createSuccess: createFlow.createSuccess,
    openCreateModal: createFlow.openCreateModal,
    openFoodUpdateModal: updateFlow.openFoodUpdateModal,
    getItemId,
    pagination: pagination.foods,
    onPageChange: (page: number) => loadTabData('foods', page),
    loading,
    onDeleteFood: deleteFlow.handleDeleteFood
  }), [entities.foods, selectedId, setSelectedId, entities.selectedFood, createFlow.createSuccess, createFlow.openCreateModal, updateFlow.openFoodUpdateModal, pagination.foods, loadTabData, loading, deleteFlow.handleDeleteFood]);

  const ingredientsTabProps = useMemo(() => ({
    ingredients: entities.ingredients,
    selectedId,
    setSelectedId,
    selectedIngredient: entities.selectedIngredient,
    createSuccess: createFlow.createSuccess,
    openCreateModal: createFlow.openCreateModal,
    openIngredientUpdateModal: updateFlow.openIngredientUpdateModal,
    getItemId,
    pagination: pagination.ingredients,
    onPageChange: (page: number) => loadTabData('ingredients', page),
    loading,
    onDeleteIngredient: deleteFlow.handleDeleteIngredient
  }), [entities.ingredients, selectedId, setSelectedId, entities.selectedIngredient, createFlow.createSuccess, createFlow.openCreateModal, updateFlow.openIngredientUpdateModal, pagination.ingredients, loadTabData, loading, deleteFlow.handleDeleteIngredient]);

  const recipesTabProps = useMemo(() => ({
    recipes: entities.recipes,
    foods: entities.foods,
    selectedId,
    setSelectedId,
    selectedRecipe: entities.selectedRecipe,
    createSuccess: createFlow.createSuccess,
    openCreateModal: createFlow.openCreateModal,
    openRecipeUpdateModal: updateFlow.openRecipeUpdateModal,
    pagination: pagination.recipes,
    onPageChange: (page: number) => loadTabData('recipes', page),
    loading,
    onDeleteRecipe: deleteFlow.handleDeleteRecipe
  }), [entities.recipes, entities.foods, selectedId, setSelectedId, entities.selectedRecipe, createFlow.createSuccess, createFlow.openCreateModal, updateFlow.openRecipeUpdateModal, pagination.recipes, loadTabData, loading, deleteFlow.handleDeleteRecipe]);

  const nutritionTabProps = useMemo(() => ({
    selectedNutrient,
    setSelectedNutrient,
    nutrientFilteredIngredients: entities.nutrientFilteredIngredients,
    setActiveTab,
    getItemId
  }), [selectedNutrient, setSelectedNutrient, entities.nutrientFilteredIngredients, setActiveTab]);

  const featuredRecipe = entities.recipes[0];
  const totalIngredients = pagination.ingredients.totalElements || entities.ingredients.length;
  const totalFoods = pagination.foods.totalElements || entities.foods.length;
  const totalRecipes = pagination.recipes.totalElements || entities.recipes.length;
  const featuredDuration = Math.max((featuredRecipe?.instructions || []).length * 5, 20);
  const featuredIngredientCount = featuredRecipe?.ingredients?.length || 0;
  const tabLabels: Record<TabKey, string> = {
    foods: 'Food',
    ingredients: 'Ingredient',
    recipes: 'Recipe',
    nutrition: 'Nutrition'
  };

  return (
    <section className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="brand-mark">
          <span className="brand-icon">🍳</span>
          <strong>Savor</strong>
        </div>
        <nav className="sidebar-nav">
          <button
            className={selectedSection === 'dashboard' ? 'tab active' : 'tab'}
            type="button"
            onClick={() => setSelectedSection('dashboard')}
          >
            Dashboard
          </button>
          {tabs.map((tab) => (
            <button
              key={tab}
              className={selectedSection === tab ? 'tab active' : 'tab'}
              onClick={() => {
                setSelectedSection(tab);
                setActiveTab(tab);
                void loadTabData(tab);
              }}
            >
              {tabLabels[tab]}
            </button>
          ))}
          <button onClick={() => void loadTabData(selectedSection === 'dashboard' ? activeTab : selectedSection)}>
            {loading ? 'Loading…' : 'Refresh tab'}
          </button>
        </nav>
        <div className="sidebar-footer">
          <p>{userEmail || 'Authenticated user'}</p>
          <button type="button" onClick={onLogout}>Logout</button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header>
          <h1>Welcome back, Chef.</h1>
          <p className="muted">Here is the overview of your culinary creations today.</p>
        </header>
        <div className="overview-grid">
          <article className="overview-card">
            <h3>Total Foods</h3>
            <p>{totalFoods}</p>
          </article>
          <article className="overview-card">
            <h3>Ingredients</h3>
            <p>{totalIngredients}</p>
          </article>
          <article className="overview-card">
            <h3>Recipes</h3>
            <p>{totalRecipes}</p>
          </article>
        </div>
        <section className="featured-recipe">
          <h2>Featured Recipe</h2>
          <div className="featured-recipe-card">
            <div className="featured-recipe-image" />
            <div className="featured-recipe-content">
              <span className="difficulty-chip">Easy</span>
              <h3>{featuredRecipe?.foodName || 'Traditional Aglio e Olio'}</h3>
              <p>{featuredRecipe?.description || 'A classic Italian pasta dish.'}</p>
              <small>{featuredDuration} mins • {featuredIngredientCount} ingredients</small>
            </div>
          </div>
        </section>

      {error && <p className="error">{error}</p>}

      {selectedSection !== 'dashboard' && activeTab === 'foods' && <FoodsTab {...foodsTabProps} />}

      {selectedSection !== 'dashboard' && activeTab === 'ingredients' && <IngredientsTab {...ingredientsTabProps} />}

      {selectedSection !== 'dashboard' && activeTab === 'recipes' && <RecipesTab {...recipesTabProps} />}

      {selectedSection !== 'dashboard' && activeTab === 'nutrition' && <NutritionTab {...nutritionTabProps} />}

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
        onCancel={handleDeleteCancel}
        onConfirm={deleteFlow.confirmDelete}
      />

      <UpdateEntityModal
        updateModal={updateFlow.updateModal}
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
      </div>
    </section>
  );
}
