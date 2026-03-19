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
import type { TabKey } from '../features/backend-explorer/types';

const tabs: TabKey[] = ['foods', 'ingredients', 'recipes', 'nutrition'];

export default function BackendExplorer() {
  const { viewState, createFlow, updateFlow, deleteFlow, entities } = useBackendExplorerController();

  const handleDeleteCancel = useCallback(() => {
    deleteFlow.setDeleteModal({ open: false, message: '', action: null });
  }, [deleteFlow]);

  const foodsTabProps = useMemo(() => ({
    foods: entities.foods,
    selectedId: viewState.selectedId,
    setSelectedId: viewState.setSelectedId,
    selectedFood: entities.selectedFood,
    createSuccess: createFlow.createSuccess,
    openCreateModal: createFlow.openCreateModal,
    getItemId,
    pagination: viewState.pagination.foods,
    onPageChange: (page: number) => viewState.loadTabData('foods', page),
    loading: viewState.loading,
    onDeleteFood: deleteFlow.handleDeleteFood
  }), [entities.foods, viewState.selectedId, viewState.setSelectedId, entities.selectedFood, createFlow.createSuccess, createFlow.openCreateModal, viewState.pagination.foods, viewState.loadTabData, viewState.loading, deleteFlow.handleDeleteFood]);

  const ingredientsTabProps = useMemo(() => ({
    ingredients: entities.ingredients,
    selectedId: viewState.selectedId,
    setSelectedId: viewState.setSelectedId,
    selectedIngredient: entities.selectedIngredient,
    createSuccess: createFlow.createSuccess,
    openCreateModal: createFlow.openCreateModal,
    openIngredientUpdateModal: updateFlow.openIngredientUpdateModal,
    getItemId,
    pagination: viewState.pagination.ingredients,
    onPageChange: (page: number) => viewState.loadTabData('ingredients', page),
    loading: viewState.loading,
    onDeleteIngredient: deleteFlow.handleDeleteIngredient
  }), [entities.ingredients, viewState.selectedId, viewState.setSelectedId, entities.selectedIngredient, createFlow.createSuccess, createFlow.openCreateModal, updateFlow.openIngredientUpdateModal, viewState.pagination.ingredients, viewState.loadTabData, viewState.loading, deleteFlow.handleDeleteIngredient]);

  const recipesTabProps = useMemo(() => ({
    recipes: entities.recipes,
    foods: entities.foods,
    selectedId: viewState.selectedId,
    setSelectedId: viewState.setSelectedId,
    selectedRecipe: entities.selectedRecipe,
    createSuccess: createFlow.createSuccess,
    openCreateModal: createFlow.openCreateModal,
    openRecipeUpdateModal: updateFlow.openRecipeUpdateModal,
    pagination: viewState.pagination.recipes,
    onPageChange: (page: number) => viewState.loadTabData('recipes', page),
    loading: viewState.loading,
    onDeleteRecipe: deleteFlow.handleDeleteRecipe
  }), [entities.recipes, entities.foods, viewState.selectedId, viewState.setSelectedId, entities.selectedRecipe, createFlow.createSuccess, createFlow.openCreateModal, updateFlow.openRecipeUpdateModal, viewState.pagination.recipes, viewState.loadTabData, viewState.loading, deleteFlow.handleDeleteRecipe]);

  const nutritionTabProps = useMemo(() => ({
    selectedNutrient: viewState.selectedNutrient,
    setSelectedNutrient: viewState.setSelectedNutrient,
    nutrientFilteredIngredients: entities.nutrientFilteredIngredients,
    setActiveTab: viewState.setActiveTab,
    getItemId
  }), [viewState.selectedNutrient, viewState.setSelectedNutrient, entities.nutrientFilteredIngredients, viewState.setActiveTab]);

  return (
    <section>
      <nav className="nav-row">
        {tabs.map((tab) => <button key={tab} className={tab === viewState.activeTab ? 'tab active' : 'tab'} onClick={() => viewState.setActiveTab(tab)}>{tab}</button>)}
        <button onClick={() => viewState.loadTabData(viewState.activeTab)}>{viewState.loading ? 'Loading…' : 'Refresh tab'}</button>
      </nav>

      {viewState.error && <p className="error">{viewState.error}</p>}

      {viewState.activeTab === 'foods' && <FoodsTab {...foodsTabProps} />}

      {viewState.activeTab === 'ingredients' && <IngredientsTab {...ingredientsTabProps} />}

      {viewState.activeTab === 'recipes' && <RecipesTab {...recipesTabProps} />}

      {viewState.activeTab === 'nutrition' && <NutritionTab {...nutritionTabProps} />}

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
    </section>
  );
}
