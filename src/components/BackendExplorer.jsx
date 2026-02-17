import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { api } from '../services/api';
import { unitOptions } from '../features/backend-explorer/constants/units';
import { getItemId, getRecipeTileId } from '../features/backend-explorer/utils/ids';
import { normalizeNutrientKey } from '../features/backend-explorer/utils/nutrients';
import CreateEntityModal from '../features/backend-explorer/modals/CreateEntityModal';
import DeleteConfirmModal from '../features/backend-explorer/modals/DeleteConfirmModal';
import UpdateEntityModal from '../features/backend-explorer/modals/UpdateEntityModal';
import FoodsTab from '../features/backend-explorer/tabs/FoodsTab';
import IngredientsTab from '../features/backend-explorer/tabs/IngredientsTab';
import RecipesTab from '../features/backend-explorer/tabs/RecipesTab';
import NutritionTab from '../features/backend-explorer/tabs/NutritionTab';
import useBackendData from '../features/backend-explorer/hooks/useBackendData';
import { createFlowReducer, initialCreateFlowState } from '../features/backend-explorer/reducers/createFlowReducer';
import { initialUpdateFlowState, updateFlowReducer } from '../features/backend-explorer/reducers/updateFlowReducer';

const tabs = ['foods', 'ingredients', 'recipes', 'nutrition'];

export default function BackendExplorer() {
  const [activeTab, setActiveTab] = useState('foods');
  const [selectedId, setSelectedId] = useState('');
  const [selectedNutrient, setSelectedNutrient] = useState('CALORIES');

  const {
    foods,
    ingredients,
    recipes,
    error,
    loading,
    setLoading,
    setError,
    loadAll,
    runWithRefresh
  } = useBackendData();

  const [foodForm, setFoodForm] = useState({ name: '', category: '', imageUrl: '' });
  const [ingredientForm, setIngredientForm] = useState({ name: '', category: '', description: '', servingAmount: '100', servingUnit: 'G', imageUrl: '' });
  const [nutritionDraft, setNutritionDraft] = useState({ nutrient: 'CALORIES', value: '', unit: 'G' });
  const [ingredientNutritions, setIngredientNutritions] = useState([]);

  const [recipeForm, setRecipeForm] = useState({ foodId: '', version: 'v1', description: '' });
  const [recipeIngredientDraft, setRecipeIngredientDraft] = useState({ ingredientId: '', quantity: '', unit: 'G', note: '' });
  const [recipeInstructionDraft, setRecipeInstructionDraft] = useState({ description: '', tutorialVideoUrl: '' });
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [recipeInstructions, setRecipeInstructions] = useState([]);

  const [createFlow, dispatchCreateFlow] = useReducer(createFlowReducer, initialCreateFlowState);
  const [updateFlow, dispatchUpdateFlow] = useReducer(updateFlowReducer, initialUpdateFlowState);
  const { createModal, createError, createSuccess } = createFlow;
  const { updateNutritionDraft, deleteModal, updateModal } = updateFlow;
  const hasLoadedInitiallyRef = useRef(false);

  useEffect(() => {
    if (hasLoadedInitiallyRef.current) return;
    hasLoadedInitiallyRef.current = true;
    loadAll();
  }, []);
  useEffect(() => { setSelectedId(''); }, [activeTab]);

  function openCreateModal(type) {
    dispatchCreateFlow({ type: 'open_create_modal', entityType: type });
  }

  function closeCreateModal() {
    dispatchCreateFlow({ type: 'close_create_modal' });
  }

  function setCreateSuccessByType(type, message) {
    dispatchCreateFlow({ type: 'set_create_success', entityType: type, message });
  }

  async function run(action) {
    await runWithRefresh(action);
  }

  function setCreateError(message) {
    dispatchCreateFlow({ type: 'set_create_error', message });
  }

  function setUpdateModal(value) {
    dispatchUpdateFlow({ type: 'set_update_modal', value });
  }

  function setDeleteModal(value) {
    dispatchUpdateFlow({ type: 'set_delete_modal', value });
  }

  function setUpdateNutritionDraft(value) {
    dispatchUpdateFlow({ type: 'set_update_nutrition_draft', value });
  }

  function addNutrition() {
    if (!nutritionDraft.value) return setCreateError('Nutrition value is required.');
    setIngredientNutritions((prev) => [...prev, { nutrient: normalizeNutrientKey(nutritionDraft.nutrient), value: Number(nutritionDraft.value), unit: nutritionDraft.unit }]);
    setNutritionDraft((prev) => ({ ...prev, value: '' }));
  }

  async function createFood() {
    if (!foodForm.name.trim()) return setCreateError('Food name is required.');
    setLoading(true);
    setCreateError('');
    try {
      await api.createFood({ name: foodForm.name.trim(), category: foodForm.category.trim(), imageUrl: foodForm.imageUrl.trim() || null, recipes: [] });
      await loadAll();
      setFoodForm({ name: '', category: '', imageUrl: '' });
      setCreateSuccessByType('food', 'Food created successfully.');
      closeCreateModal();
    } catch (createFoodError) {
      setCreateError(createFoodError.message);
    } finally {
      setLoading(false);
    }
  }

  async function createIngredient() {
    if (!ingredientForm.name.trim()) return setCreateError('Ingredient name is required.');
    setLoading(true);
    setCreateError('');
    try {
      await api.createIngredient({
        name: ingredientForm.name.trim(),
        category: ingredientForm.category.trim(),
        description: ingredientForm.description.trim(),
        servingAmount: Number(ingredientForm.servingAmount || 0),
        servingUnit: ingredientForm.servingUnit || 'G',
        imageUrl: ingredientForm.imageUrl.trim() || null,
        nutritionList: ingredientNutritions.map((n) => ({ ...n, nutrient: normalizeNutrientKey(n.nutrient) })),
        nearbyStoreListings: []
      });
      await loadAll();
      setIngredientForm({ name: '', category: '', description: '', servingAmount: '100', servingUnit: 'G', imageUrl: '' });
      setIngredientNutritions([]);
      setNutritionDraft({ nutrient: 'CALORIES', value: '', unit: 'G' });
      setCreateSuccessByType('ingredient', 'Ingredient created successfully.');
      closeCreateModal();
    } catch (createIngredientError) {
      setCreateError(createIngredientError.message);
    } finally {
      setLoading(false);
    }
  }

  function addRecipeIngredient() {
    if (!recipeIngredientDraft.ingredientId || !recipeIngredientDraft.quantity) return setCreateError('Recipe ingredient needs ingredient and quantity.');
    const ingredientId = Number(recipeIngredientDraft.ingredientId);
    setRecipeIngredients((prev) => [...prev, {
      ingredientId,
      ingredientName: ingredients.find((item) => String(getItemId(item)) === String(ingredientId))?.name || '',
      quantity: Number(recipeIngredientDraft.quantity),
      unit: recipeIngredientDraft.unit || 'G',
      note: recipeIngredientDraft.note || ''
    }]);
    setRecipeIngredientDraft({ ingredientId: '', quantity: '', unit: 'G', note: '' });
  }

  function addRecipeInstruction() {
    if (!recipeInstructionDraft.description.trim()) return setCreateError('Instruction description is required.');
    setRecipeInstructions((prev) => [...prev, { step: prev.length + 1, description: recipeInstructionDraft.description.trim(), tutorialVideoUrl: recipeInstructionDraft.tutorialVideoUrl.trim() || null }]);
    setRecipeInstructionDraft({ description: '', tutorialVideoUrl: '' });
  }

  async function createRecipe() {
    if (!recipeForm.foodId) return setCreateError('Please select food for recipe.');
    if (!recipeForm.version.trim()) return setCreateError('Recipe version is required.');
    if (!recipeIngredients.length) return setCreateError('Please add at least one recipe ingredient.');
    if (!recipeInstructions.length) return setCreateError('Please add at least one recipe instruction.');
    setLoading(true);
    setCreateError('');
    try {
      await api.createRecipeForFoodViaRecipeApi(recipeForm.foodId, {
        version: recipeForm.version.trim(),
        description: recipeForm.description.trim(),
        foodId: Number(recipeForm.foodId),
        ingredients: recipeIngredients.map(({ ingredientId, quantity, unit, note }) => ({ ingredientId, quantity: Number(quantity), unit, note })),
        instructions: recipeInstructions.map((item, index) => ({ stepNumber: index + 1, description: item.description, tutorialVideoUrl: item.tutorialVideoUrl }))
      });
      await loadAll();
      setRecipeForm({ foodId: '', version: 'v1', description: '' });
      setRecipeIngredients([]);
      setRecipeInstructions([]);
      setCreateSuccessByType('recipe', 'Recipe created successfully.');
      closeCreateModal();
    } catch (createRecipeError) {
      setCreateError(createRecipeError.message);
    } finally {
      setLoading(false);
    }
  }


  function addUpdateNutrition() {
    if (!updateNutritionDraft.value) return setError('Nutrition value is required.');
    setUpdateModal((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        nutritionList: [
          ...(prev.form.nutritionList || []),
          { nutrient: normalizeNutrientKey(updateNutritionDraft.nutrient), value: Number(updateNutritionDraft.value), unit: updateNutritionDraft.unit }
        ]
      }
    }));
    setUpdateNutritionDraft((prev) => ({ ...prev, value: '' }));
  }

  function requestDelete(message, action) { setDeleteModal({ open: true, message, action }); }
  async function confirmDelete() {
    if (!deleteModal.action) return setDeleteModal({ open: false, message: '', action: null });
    await run(deleteModal.action);
    setDeleteModal({ open: false, message: '', action: null });
  }

  function openIngredientUpdateModal(item) {
    setUpdateNutritionDraft({ nutrient: 'CALORIES', value: '', unit: 'G' });
    setUpdateModal({
      open: true,
      type: 'ingredient',
      itemId: getItemId(item),
      title: `Update ${item?.name || 'Ingredient'}`,
      form: {
        name: item?.name || '',
        category: item?.category || '',
        description: item?.description || '',
        servingAmount: String(item?.servingAmount ?? ''),
        servingUnit: item?.servingUnit || 'G',
        imageUrl: item?.imageUrl || '',
        nutritionList: Array.isArray(item?.nutritionList) ? item.nutritionList.map((n) => ({ nutrient: normalizeNutrientKey(n.nutrient), value: n.value ?? '', unit: n.unit || 'G' })) : []
      }
    });
  }

  function openRecipeUpdateModal(item) {
    setUpdateModal({
      open: true,
      type: 'recipe',
      itemId: getItemId(item),
      title: `Update ${item?.foodName || 'Recipe'} ${item?.version ? `(${item.version})` : ''}`,
      form: {
        foodId: String(item?.foodId ?? ''),
        version: item?.version || '',
        description: item?.description || '',
        ingredients: Array.isArray(item?.ingredients) ? item.ingredients.map((ri) => ({ ingredientId: String(ri.ingredientId ?? ''), quantity: String(ri.quantity ?? ''), unit: ri.unit || 'G', note: ri.note || '' })) : [],
        instructions: Array.isArray(item?.instructions) ? item.instructions.map((inst) => ({ description: inst.description || '', tutorialVideoUrl: inst.tutorialVideoUrl || '' })) : []
      }
    });
  }

  async function confirmUpdate() {
    if (updateModal.type === 'ingredient') {
      const form = updateModal.form;
      await run(() => api.updateIngredient(updateModal.itemId, {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        servingAmount: Number(form.servingAmount || 0),
        servingUnit: form.servingUnit || 'G',
        imageUrl: form.imageUrl.trim() || null,
        nutritionList: form.nutritionList.map((n) => ({ nutrient: normalizeNutrientKey(n.nutrient), value: Number(n.value), unit: n.unit })),
        nearbyStoreListings: []
      }));
    }

    if (updateModal.type === 'recipe') {
      const form = updateModal.form;
      await run(() => api.updateRecipe(updateModal.itemId, {
        version: form.version.trim(),
        description: form.description.trim(),
        foodId: Number(form.foodId),
        ingredients: form.ingredients.map((ri) => ({ ingredientId: Number(ri.ingredientId), quantity: Number(ri.quantity), unit: ri.unit, note: ri.note || '' })),
        instructions: form.instructions.map((inst, index) => ({ stepNumber: index + 1, description: inst.description, tutorialVideoUrl: inst.tutorialVideoUrl || null }))
      }));
    }

    setUpdateModal({ open: false, type: '', title: '', itemId: null, form: null });
  }

  const selectedFood = useMemo(() => foods.find((item) => String(getItemId(item)) === String(selectedId)), [foods, selectedId]);
  const selectedIngredient = useMemo(() => ingredients.find((item) => String(getItemId(item)) === String(selectedId)), [ingredients, selectedId]);
  const selectedRecipe = useMemo(() => recipes.find((item, index) => String(getRecipeTileId(item, index)) === String(selectedId)), [recipes, selectedId]);
  const nutrientFilteredIngredients = useMemo(() => ingredients.filter((ingredient) => Array.isArray(ingredient?.nutritionList) && ingredient.nutritionList.some((nutrition) => nutrition?.nutrient === selectedNutrient)), [ingredients, selectedNutrient]);

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
          requestDelete={requestDelete}
          getItemId={getItemId}
          api={api}
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
          requestDelete={requestDelete}
          openIngredientUpdateModal={openIngredientUpdateModal}
          getItemId={getItemId}
          api={api}
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
          requestDelete={requestDelete}
          openRecipeUpdateModal={openRecipeUpdateModal}
          getItemId={getItemId}
          api={api}
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
