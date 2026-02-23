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
  const controller = useBackendExplorerController();

  const {
    activeTab,
    setActiveTab,
    selectedId,
    setSelectedId,
    selectedNutrient,
    setSelectedNutrient,
    foods,
    ingredients,
    recipes,
    error,
    loading,
    loadAll,
    createModal,
    createError,
    createSuccess,
    openCreateModal,
    closeCreateModal,
    createFood,
    createIngredient,
    createRecipe,
    foodForm,
    setFoodForm,
    ingredientForm,
    setIngredientForm,
    ingredientNutritions,
    setIngredientNutritions,
    nutritionDraft,
    setNutritionDraft,
    addNutrition,
    recipeForm,
    setRecipeForm,
    recipeIngredients,
    setRecipeIngredients,
    recipeIngredientDraft,
    setRecipeIngredientDraft,
    addRecipeIngredient,
    recipeInstructionDraft,
    setRecipeInstructionDraft,
    addRecipeInstruction,
    recipeInstructions,
    setRecipeInstructions,
    deleteModal,
    setDeleteModal,
    confirmDelete,
    updateModal,
    setUpdateModal,
    updateNutritionDraft,
    setUpdateNutritionDraft,
    addUpdateNutrition,
    confirmUpdate,
    selectedFood,
    selectedIngredient,
    selectedRecipe,
    nutrientFilteredIngredients,
    openIngredientUpdateModal,
    openRecipeUpdateModal,
    handleDeleteFood,
    handleDeleteIngredient,
    handleDeleteRecipe
  } = controller;

  return (
    <section>
      <nav className="nav-row">
        {tabs.map((tab) => <button key={tab} className={tab === activeTab ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab)}>{tab}</button>)}
        <button onClick={loadAll}>{loading ? 'Loading…' : 'Refresh all'}</button>
      </nav>

      {error && <p className="error">{error}</p>}

      {activeTab === 'foods' && (
        <FoodsTab
          foods={foods}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          selectedFood={selectedFood}
          createSuccess={createSuccess}
          openCreateModal={openCreateModal}
          getItemId={getItemId}
          onDeleteFood={handleDeleteFood}
        />
      )}

      {activeTab === 'ingredients' && (
        <IngredientsTab
          ingredients={ingredients}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          selectedIngredient={selectedIngredient}
          createSuccess={createSuccess}
          openCreateModal={openCreateModal}
          openIngredientUpdateModal={openIngredientUpdateModal}
          getItemId={getItemId}
          onDeleteIngredient={handleDeleteIngredient}
        />
      )}

      {activeTab === 'recipes' && (
        <RecipesTab
          recipes={recipes}
          foods={foods}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          selectedRecipe={selectedRecipe}
          createSuccess={createSuccess}
          openCreateModal={openCreateModal}
          openRecipeUpdateModal={openRecipeUpdateModal}
          onDeleteRecipe={handleDeleteRecipe}
        />
      )}

      {activeTab === 'nutrition' && (
        <NutritionTab
          selectedNutrient={selectedNutrient}
          setSelectedNutrient={setSelectedNutrient}
          nutrientFilteredIngredients={nutrientFilteredIngredients}
          setActiveTab={setActiveTab}
          getItemId={getItemId}
        />
      )}

      <CreateEntityModal
        createModal={createModal}
        createError={createError}
        closeCreateModal={closeCreateModal}
        createFood={createFood}
        createIngredient={createIngredient}
        createRecipe={createRecipe}
        foodForm={foodForm}
        setFoodForm={setFoodForm}
        ingredientForm={ingredientForm}
        setIngredientForm={setIngredientForm}
        ingredientNutritions={ingredientNutritions}
        setIngredientNutritions={setIngredientNutritions}
        nutritionDraft={nutritionDraft}
        setNutritionDraft={setNutritionDraft}
        unitOptions={unitOptions}
        addNutrition={addNutrition}
        recipeForm={recipeForm}
        setRecipeForm={setRecipeForm}
        foods={foods}
        getItemId={getItemId}
        recipeIngredients={recipeIngredients}
        setRecipeIngredients={setRecipeIngredients}
        ingredients={ingredients}
        recipeIngredientDraft={recipeIngredientDraft}
        setRecipeIngredientDraft={setRecipeIngredientDraft}
        addRecipeIngredient={addRecipeIngredient}
        recipeInstructionDraft={recipeInstructionDraft}
        setRecipeInstructionDraft={setRecipeInstructionDraft}
        addRecipeInstruction={addRecipeInstruction}
        recipeInstructions={recipeInstructions}
        setRecipeInstructions={setRecipeInstructions}
      />

      <DeleteConfirmModal
        deleteModal={deleteModal}
        onCancel={() => setDeleteModal({ open: false, message: '', action: null })}
        onConfirm={confirmDelete}
      />

      <UpdateEntityModal
        updateModal={updateModal}
        setUpdateModal={setUpdateModal}
        unitOptions={unitOptions}
        foods={foods}
        ingredients={ingredients}
        getItemId={getItemId}
        updateNutritionDraft={updateNutritionDraft}
        setUpdateNutritionDraft={setUpdateNutritionDraft}
        addUpdateNutrition={addUpdateNutrition}
        confirmUpdate={confirmUpdate}
      />
    </section>
  );
}
