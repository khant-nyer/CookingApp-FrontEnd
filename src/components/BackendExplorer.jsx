import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const tabs = ['foods', 'ingredients', 'recipes', 'nutrition'];
const nutrientOptions = [
  'PROTEIN', 'CARBOHYDRATES', 'FAT', 'FIBER', 'DIETARY_FIBER', 'SUGAR', 'CALORIES',
  'SATURATED_FAT', 'TRANS_FAT', 'OMEGA_3', 'OMEGA_6', 'SODIUM', 'POTASSIUM', 'CALCIUM', 'IRON',
  'MAGNESIUM', 'ZINC', 'VITAMIN_A', 'VITAMIN_B1', 'VITAMIN_B2', 'VITAMIN_B3', 'VITAMIN_B6',
  'VITAMIN_B9', 'SELENIUM', 'VITAMIN_C', 'VITAMIN_D', 'VITAMIN_E', 'VITAMIN_K', 'VITAMIN_B12'
];
const unitOptions = ['G', 'KG', 'MG', 'MCG', 'ML', 'L', 'TSP', 'TBSP', 'CUP', 'OZ', 'LB', 'PIECE', 'PINCH', 'CLOVE', 'SLICE'];
const nutrientIcons = {
  CALORIES: '🔥', PROTEIN: '💪', CARBOHYDRATES: '🍞', FAT: '🥑', FIBER: '🌾', DIETARY_FIBER: '🌿',
  SUGAR: '🍬', SATURATED_FAT: '🧈', TRANS_FAT: '⚠️', OMEGA_3: '🐟', OMEGA_6: '🌰', SODIUM: '🧂',
  POTASSIUM: '🍌', CALCIUM: '🦴', IRON: '🩸', MAGNESIUM: '⚙️', ZINC: '🔩', VITAMIN_A: '🥕',
  VITAMIN_B1: '🧠', VITAMIN_B2: '⚡', VITAMIN_B3: '🌟', VITAMIN_B6: '🍗', VITAMIN_B9: '🥬',
  VITAMIN_B12: '🥩', VITAMIN_C: '🍊', VITAMIN_D: '☀️', VITAMIN_E: '🌻', VITAMIN_K: '🥦', SELENIUM: '🧪'
};

function getItemId(item) {
  return item?.id || item?._id;
}

function getRecipeTileId(recipe, index) {
  return getItemId(recipe) || `${recipe?.foodId || 'food'}-${recipe?.version || 'version'}-${index}`;
}

function GalleryTile({ imageUrl, fallbackText, onClick, isSelected, subtitle }) {
  return (
    <button className={isSelected ? 'gallery-tile selected' : 'gallery-tile'} onClick={onClick}>
      {imageUrl ? <img src={imageUrl} alt={fallbackText} className="gallery-image" /> : <div className="gallery-fallback">{fallbackText}</div>}
      <div className="gallery-caption">{fallbackText}</div>
      {subtitle ? <div className="gallery-subtitle">{subtitle}</div> : null}
    </button>
  );
}

function TextDetail({ title, imageUrl, fields = [], sections = [], onDelete, onUpdate }) {
  return (
    <div className="card detail-card">
      <h3>{title}</h3>
      {imageUrl ? <img src={imageUrl} alt={title} className="detail-image" /> : null}
      <div className="detail-content">
        {fields.map((field) => (
          <p key={field.label}><strong>{field.label}:</strong> {field.value || '-'}</p>
        ))}
        {sections.map((section) => (
          <div key={section.title} className="detail-section">
            <strong>{section.title}</strong>
            {!section.items.length ? <p className="muted">No data.</p> : null}
            {section.items.map((item, index) => (
              <p key={`${section.title}-${index}`} className="small-line">• {item}</p>
            ))}
          </div>
        ))}
      </div>
      <div className="detail-actions">
        {onUpdate ? <button className="secondary" onClick={onUpdate}>Update</button> : null}
        <button className="danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

function NutritionIcon({ nutrient, selected, onClick }) {
  return (
    <button className={selected ? 'nutrient-pill selected' : 'nutrient-pill'} onClick={onClick}>
      <span className="nutrient-icon">{nutrientIcons[nutrient] || '🧪'}</span>
      <small>{nutrient}</small>
    </button>
  );
}

function NutritionSummaryCards({ items = [], onRemove, onValueChange, onUnitChange }) {
  return (
    <div className="summary-card-grid">
      {items.map((nutrition, index) => (
        <div key={`${nutrition.nutrient}-${index}`} className="mini-summary-card">
          <button type="button" className="mini-remove" onClick={() => onRemove(index)}>×</button>
          <div className="mini-summary-head">
            <span className="nutrient-icon">{nutrientIcons[nutrition.nutrient] || '🧪'}</span>
            <strong>{nutrition.nutrient}</strong>
          </div>
          <div className="mini-summary-fields">
            <input type="number" value={nutrition.value} onChange={(e) => onValueChange(index, e.target.value)} placeholder="Amount" />
            <select value={nutrition.unit} onChange={(e) => onUnitChange(index, e.target.value)}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecipeIngredientSummaryCards({ items = [], ingredients = [], onChange, onRemove }) {
  return (
    <div className="summary-card-grid">
      {items.map((item, index) => (
        <div key={`recipe-ingredient-${index}`} className="mini-summary-card">
          <button type="button" className="mini-remove" onClick={() => onRemove(index)}>×</button>
          <div className="mini-summary-head">
            <span>🥣</span>
            <strong>{item.ingredientName || ingredients.find((ing) => String(getItemId(ing)) === String(item.ingredientId))?.name || 'Ingredient'}</strong>
          </div>
          <div className="mini-summary-fields">
            <select value={item.ingredientId} onChange={(e) => onChange(index, { ingredientId: Number(e.target.value), ingredientName: ingredients.find((ing) => String(getItemId(ing)) === String(e.target.value))?.name || '' })}>{ingredients.map((ing) => <option key={getItemId(ing)} value={getItemId(ing)}>{ing.name}</option>)}</select>
            <input type="number" value={item.quantity} onChange={(e) => onChange(index, { quantity: Number(e.target.value) })} placeholder="Quantity" />
            <select value={item.unit} onChange={(e) => onChange(index, { unit: e.target.value })}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
            <input value={item.note || ''} onChange={(e) => onChange(index, { note: e.target.value })} placeholder="Note" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BackendExplorer() {
  const [activeTab, setActiveTab] = useState('foods');
  const [foods, setFoods] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedNutrient, setSelectedNutrient] = useState('CALORIES');

  const [foodForm, setFoodForm] = useState({ name: '', category: '', imageUrl: '' });
  const [ingredientForm, setIngredientForm] = useState({ name: '', category: '', description: '', servingAmount: '100', servingUnit: 'G', imageUrl: '' });
  const [nutritionDraft, setNutritionDraft] = useState({ nutrient: 'CALORIES', value: '', unit: 'G' });
  const [ingredientNutritions, setIngredientNutritions] = useState([]);

  const [recipeForm, setRecipeForm] = useState({ foodId: '', version: 'v1', description: '' });
  const [recipeIngredientDraft, setRecipeIngredientDraft] = useState({ ingredientId: '', quantity: '', unit: 'G', note: '' });
  const [recipeInstructionDraft, setRecipeInstructionDraft] = useState({ description: '', tutorialVideoUrl: '' });
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [recipeInstructions, setRecipeInstructions] = useState([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createModal, setCreateModal] = useState({ open: false, type: '' });
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState({ food: '', ingredient: '', recipe: '' });
  const [updateNutritionPicker, setUpdateNutritionPicker] = useState({ open: false, nutrient: 'CALORIES' });
  const [deleteModal, setDeleteModal] = useState({ open: false, message: '', action: null });
  const [updateModal, setUpdateModal] = useState({ open: false, type: '', title: '', itemId: null, form: null });

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [foodData, ingredientData, recipeData] = await Promise.all([api.getFoods(), api.getIngredients(), api.getRecipes()]);
      setFoods(Array.isArray(foodData) ? foodData : []);
      setIngredients(Array.isArray(ingredientData) ? ingredientData : []);
      setRecipes(Array.isArray(recipeData) ? recipeData : []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { setSelectedId(''); }, [activeTab]);

  function openCreateModal(type) {
    setCreateError('');
    setCreateSuccess((prev) => ({ ...prev, [type]: '' }));
    setCreateModal({ open: true, type });
  }

  function closeCreateModal() {
    setCreateError('');
    setCreateModal({ open: false, type: '' });
  }

  function setCreateSuccessByType(type, message) {
    setCreateSuccess((prev) => ({ ...prev, [type]: message }));
  }

  async function run(action) {
    setLoading(true);
    setError('');
    try {
      await action();
      await loadAll();
    } catch (actionError) {
      setError(actionError.message);
      setLoading(false);
    }
  }

  function addNutrition() {
    if (!nutritionDraft.value) return setCreateError('Nutrition value is required.');
    setIngredientNutritions((prev) => [...prev, { nutrient: nutritionDraft.nutrient, value: Number(nutritionDraft.value), unit: nutritionDraft.unit }]);
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
        nutritionList: ingredientNutritions,
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
    if (!updateNutritionPicker.nutrient) return;
    setUpdateModal((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        nutritionList: [...(prev.form.nutritionList || []), { nutrient: updateNutritionPicker.nutrient, value: '', unit: 'G' }]
      }
    }));
    setUpdateNutritionPicker({ open: false, nutrient: 'CALORIES' });
  }

  function requestDelete(message, action) { setDeleteModal({ open: true, message, action }); }
  async function confirmDelete() {
    if (!deleteModal.action) return setDeleteModal({ open: false, message: '', action: null });
    await run(deleteModal.action);
    setDeleteModal({ open: false, message: '', action: null });
  }

  function openIngredientUpdateModal(item) {
    setUpdateNutritionPicker({ open: false, nutrient: 'CALORIES' });
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
        nutritionList: Array.isArray(item?.nutritionList) ? item.nutritionList.map((n) => ({ nutrient: n.nutrient || 'CALORIES', value: n.value ?? '', unit: n.unit || 'G' })) : []
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
        nutritionList: form.nutritionList.map((n) => ({ nutrient: n.nutrient, value: Number(n.value), unit: n.unit })),
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
        <div className="grid">
          <div className="card">
            <button onClick={() => openCreateModal('food')}>Create Food</button>
            {createSuccess.food ? <p className="success">{createSuccess.food}</p> : null}
            <h3>Gallery</h3>
            <div className="gallery-grid">
              {foods.map((food) => {
                const id = getItemId(food);
                return <GalleryTile key={id || food.name} imageUrl={food.imageUrl} fallbackText={food.name || 'Unnamed food'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(id)} />;
              })}
            </div>
          </div>

          {selectedFood ? (
            <TextDetail
              title={selectedFood.name || 'Food details'}
              imageUrl={selectedFood.imageUrl}
              fields={[{ label: 'Category', value: selectedFood.category }, { label: 'ID', value: selectedFood.id }]}
              sections={[{ title: 'Recipes', items: (selectedFood.recipes || []).map((r) => r.name || `Recipe #${r.id}`) }]}
              onDelete={() => requestDelete('Delete this food?', () => api.deleteFood(getItemId(selectedFood)))}
            />
          ) : <div className="card muted">Select a food image to view details.</div>}
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div className="grid">
          <div className="card">
            <button onClick={() => openCreateModal('ingredient')}>Create Ingredient</button>
            {createSuccess.ingredient ? <p className="success">{createSuccess.ingredient}</p> : null}
            <h3>Gallery</h3>
            <div className="gallery-grid">
              {ingredients.map((ingredient) => {
                const id = getItemId(ingredient);
                return <GalleryTile key={id || ingredient.name} imageUrl={ingredient.imageUrl} fallbackText={ingredient.name || 'Unnamed ingredient'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(id)} />;
              })}
            </div>
          </div>

          {selectedIngredient ? (
            <TextDetail
              title={selectedIngredient.name || 'Ingredient details'}
              imageUrl={selectedIngredient.imageUrl}
              fields={[
                { label: 'Category', value: selectedIngredient.category },
                { label: 'Description', value: selectedIngredient.description },
                { label: 'Serving', value: `${selectedIngredient.servingAmount || '-'} ${selectedIngredient.servingUnit || ''}` }
              ]}
              sections={[{ title: 'Nutritions', items: (selectedIngredient.nutritionList || []).map((n) => `${n.nutrient}: ${n.value} ${n.unit}`) }]}
              onDelete={() => requestDelete('Delete this ingredient?', () => api.deleteIngredient(getItemId(selectedIngredient)))}
              onUpdate={() => openIngredientUpdateModal(selectedIngredient)}
            />
          ) : <div className="card muted">Select an ingredient image to view details.</div>}
        </div>
      )}

      {activeTab === 'recipes' && (
        <div className="grid">
          <div className="card">
            <button onClick={() => openCreateModal('recipe')}>Create Recipe</button>
            {createSuccess.recipe ? <p className="success">{createSuccess.recipe}</p> : null}
            <h3>Gallery</h3>
            <div className="gallery-grid">
              {recipes.map((recipe, index) => {
                const id = getRecipeTileId(recipe, index);
                const foodName = recipe.foodName || foods.find((food) => food.id === recipe.foodId)?.name || 'Food';
                return <GalleryTile key={id} imageUrl={null} fallbackText={foodName} subtitle={recipe.version || 'No version'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(id)} />;
              })}
            </div>
          </div>

          {selectedRecipe ? (
            <TextDetail
              title={`${selectedRecipe.foodName || 'Recipe'} ${selectedRecipe.version ? `(${selectedRecipe.version})` : ''}`}
              fields={[{ label: 'Food', value: selectedRecipe.foodName }, { label: 'Version', value: selectedRecipe.version }, { label: 'Description', value: selectedRecipe.description }]}
              sections={[
                { title: 'Ingredients', items: (selectedRecipe.ingredients || []).map((i) => `${i.ingredientName || i.ingredientId}: ${i.quantity} ${i.unit}${i.note ? ` (${i.note})` : ''}`) },
                { title: 'Instructions', items: (selectedRecipe.instructions || []).map((ins, idx) => `Step ${ins.step || ins.stepNumber || idx + 1}: ${ins.description}`) }
              ]}
              onDelete={() => requestDelete('Delete this recipe?', () => api.deleteRecipe(getItemId(selectedRecipe)))}
              onUpdate={() => openRecipeUpdateModal(selectedRecipe)}
            />
          ) : <div className="card muted">Select a recipe card to view details.</div>}
        </div>
      )}

      {activeTab === 'nutrition' && (
        <div className="grid">
          <div className="card">
            <h3>Nutrients</h3>
            <p className="muted">Select a nutrient to view ingredients containing it.</p>
            <div className="nutrient-grid">
              {nutrientOptions.map((nutrient) => (
                <NutritionIcon key={nutrient} nutrient={nutrient} selected={nutrient === selectedNutrient} onClick={() => setSelectedNutrient(nutrient)} />
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Ingredients with {selectedNutrient}</h3>
            {!nutrientFilteredIngredients.length ? <p className="muted">No ingredients found with this nutrient.</p> : null}
            <div className="gallery-grid">
              {nutrientFilteredIngredients.map((ingredient) => {
                const match = ingredient.nutritionList?.find((item) => item.nutrient === selectedNutrient);
                return <GalleryTile key={getItemId(ingredient) || ingredient.name} imageUrl={ingredient.imageUrl} fallbackText={ingredient.name || 'Unnamed ingredient'} subtitle={match ? `${match.value} ${match.unit}` : ''} onClick={() => setActiveTab('ingredients')} />;
              })}
            </div>
          </div>
        </div>
      )}


      {createModal.open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-large">
            <h3>
              {createModal.type === 'food'
                ? 'Create Food'
                : createModal.type === 'ingredient'
                  ? 'Create Ingredient'
                  : 'Create Recipe'}
            </h3>
            {createError ? <p className="error">{createError}</p> : null}

            {createModal.type === 'food' ? (
              <div className="form">
                <input placeholder="Name" value={foodForm.name} onChange={(e) => setFoodForm((p) => ({ ...p, name: e.target.value }))} />
                <input placeholder="Category" value={foodForm.category} onChange={(e) => setFoodForm((p) => ({ ...p, category: e.target.value }))} />
                <input placeholder="Image URL" value={foodForm.imageUrl} onChange={(e) => setFoodForm((p) => ({ ...p, imageUrl: e.target.value }))} />
              </div>
            ) : null}

            {createModal.type === 'ingredient' ? (
              <>
                <div className="form">
                  <input placeholder="Name" value={ingredientForm.name} onChange={(e) => setIngredientForm((p) => ({ ...p, name: e.target.value }))} />
                  <input placeholder="Category" value={ingredientForm.category} onChange={(e) => setIngredientForm((p) => ({ ...p, category: e.target.value }))} />
                  <input placeholder="Description" value={ingredientForm.description} onChange={(e) => setIngredientForm((p) => ({ ...p, description: e.target.value }))} />
                  <input placeholder="Serving Amount" type="number" value={ingredientForm.servingAmount} onChange={(e) => setIngredientForm((p) => ({ ...p, servingAmount: e.target.value }))} />
                  <select value={ingredientForm.servingUnit} onChange={(e) => setIngredientForm((p) => ({ ...p, servingUnit: e.target.value }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                  <input placeholder="Image URL" value={ingredientForm.imageUrl} onChange={(e) => setIngredientForm((p) => ({ ...p, imageUrl: e.target.value }))} />
                </div>

                <h4>Add Nutrition</h4>
                <div className="summary-box">
                  <strong>Nutrition Summary (Editable)</strong>
                  {!ingredientNutritions.length ? <p className="muted">No nutrition added yet.</p> : null}
                  <NutritionSummaryCards
                    items={ingredientNutritions}
                    onRemove={(index) => setIngredientNutritions((prev) => prev.filter((_, idx) => idx !== index))}
                    onValueChange={(index, value) => setIngredientNutritions((prev) => prev.map((item, idx) => idx === index ? { ...item, value: Number(value) } : item))}
                    onUnitChange={(index, unit) => setIngredientNutritions((prev) => prev.map((item, idx) => idx === index ? { ...item, unit } : item))}
                  />
                </div>
                <div className="inline-builder">
                  <select value={nutritionDraft.nutrient} onChange={(e) => setNutritionDraft((p) => ({ ...p, nutrient: e.target.value }))}>{nutrientOptions.map((n) => <option key={n} value={n}>{n}</option>)}</select>
                  <input type="number" placeholder="Value" value={nutritionDraft.value} onChange={(e) => setNutritionDraft((p) => ({ ...p, value: e.target.value }))} />
                  <select value={nutritionDraft.unit} onChange={(e) => setNutritionDraft((p) => ({ ...p, unit: e.target.value }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                  <button onClick={addNutrition}>Add Nutrition</button>
                </div>
              </>
            ) : null}

            {createModal.type === 'recipe' ? (
              <>
                <div className="form">
                  <select value={recipeForm.foodId} onChange={(e) => setRecipeForm((p) => ({ ...p, foodId: e.target.value }))}>
                    <option value="">Select food</option>
                    {foods.map((food) => <option key={getItemId(food)} value={getItemId(food)}>{food.name}</option>)}
                  </select>
                  <input placeholder="Version" value={recipeForm.version} onChange={(e) => setRecipeForm((p) => ({ ...p, version: e.target.value }))} />
                  <input placeholder="Description" value={recipeForm.description} onChange={(e) => setRecipeForm((p) => ({ ...p, description: e.target.value }))} />
                </div>

                <h4>Add Ingredient</h4>
                <p className="muted">If you don't find ingredient in the list, you can create one in ingredient tab.</p>
                <div className="summary-box">
                  <strong>Recipe Ingredients Summary (Editable)</strong>
                  {!recipeIngredients.length ? <p className="muted">No recipe ingredients added yet.</p> : null}
                  <RecipeIngredientSummaryCards
                    items={recipeIngredients}
                    ingredients={ingredients}
                    onChange={(index, patch) => setRecipeIngredients((prev) => prev.map((current, idx) => idx === index ? { ...current, ...patch } : current))}
                    onRemove={(index) => setRecipeIngredients((prev) => prev.filter((_, idx) => idx !== index))}
                  />
                </div>
                <div className="inline-builder">
                  <select value={recipeIngredientDraft.ingredientId} onChange={(e) => setRecipeIngredientDraft((p) => ({ ...p, ingredientId: e.target.value }))}>
                    <option value="">Ingredient</option>
                    {ingredients.map((ingredient) => <option key={getItemId(ingredient)} value={getItemId(ingredient)}>{ingredient.name}</option>)}
                  </select>
                  <input type="number" placeholder="Quantity" value={recipeIngredientDraft.quantity} onChange={(e) => setRecipeIngredientDraft((p) => ({ ...p, quantity: e.target.value }))} />
                  <select value={recipeIngredientDraft.unit} onChange={(e) => setRecipeIngredientDraft((p) => ({ ...p, unit: e.target.value }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                  <input placeholder="Note" value={recipeIngredientDraft.note} onChange={(e) => setRecipeIngredientDraft((p) => ({ ...p, note: e.target.value }))} />
                  <button onClick={addRecipeIngredient}>Add Ingredient</button>
                </div>

                <h4>Add Instruction</h4>
                <div className="inline-builder">
                  <input placeholder="Instruction description" value={recipeInstructionDraft.description} onChange={(e) => setRecipeInstructionDraft((p) => ({ ...p, description: e.target.value }))} />
                  <input placeholder="Tutorial video URL (optional)" value={recipeInstructionDraft.tutorialVideoUrl} onChange={(e) => setRecipeInstructionDraft((p) => ({ ...p, tutorialVideoUrl: e.target.value }))} />
                  <button onClick={addRecipeInstruction}>Add Instruction</button>
                </div>

                <div className="summary-box">
                  <strong>Recipe Instructions Summary (Editable)</strong>
                  {!recipeInstructions.length ? <p className="muted">No instructions added yet.</p> : null}
                  {recipeInstructions.map((item, index) => (
                    <div key={`recipe-instruction-${index}`} className="summary-row">
                      <input type="number" value={index + 1} readOnly />
                      <input value={item.description} onChange={(e) => setRecipeInstructions((prev) => prev.map((current, idx) => idx === index ? { ...current, description: e.target.value } : current))} />
                      <input value={item.tutorialVideoUrl || ''} onChange={(e) => setRecipeInstructions((prev) => prev.map((current, idx) => idx === index ? { ...current, tutorialVideoUrl: e.target.value } : current))} />
                      <button className="danger" onClick={() => setRecipeInstructions((prev) => prev.filter((_, idx) => idx !== index))}>Remove</button>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            <div className="detail-actions">
              <button onClick={closeCreateModal}>Cancel</button>
              <button onClick={createModal.type === 'food' ? createFood : createModal.type === 'ingredient' ? createIngredient : createRecipe}>Create</button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteModal.open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Confirm Delete</h3>
            <p>{deleteModal.message}</p>
            <div className="detail-actions">
              <button onClick={() => setDeleteModal({ open: false, message: '', action: null })}>Cancel</button>
              <button className="danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      ) : null}

      {updateModal.open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-large">
            <h3>{updateModal.title}</h3>
            {updateModal.type === 'ingredient' ? (
              <div className="form">
                <input placeholder="Name" value={updateModal.form.name} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, name: e.target.value } }))} />
                <input placeholder="Category" value={updateModal.form.category} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, category: e.target.value } }))} />
                <input placeholder="Description" value={updateModal.form.description} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, description: e.target.value } }))} />
                <div className="summary-row">
                  <input type="number" placeholder="Serving Amount" value={updateModal.form.servingAmount} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, servingAmount: e.target.value } }))} />
                  <select value={updateModal.form.servingUnit} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, servingUnit: e.target.value } }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                </div>
                <input placeholder="Image URL" value={updateModal.form.imageUrl} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, imageUrl: e.target.value } }))} />
                <div className="summary-box">
                  <div className="summary-head">
                    <strong>Nutrition</strong>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setUpdateNutritionPicker((prev) => ({ ...prev, open: !prev.open }))}
                    >
                      Add Nutrition
                    </button>
                  </div>
                  {updateNutritionPicker.open ? (
                    <div className="inline-builder">
                      <select value={updateNutritionPicker.nutrient} onChange={(e) => setUpdateNutritionPicker((prev) => ({ ...prev, nutrient: e.target.value }))}>{nutrientOptions.map((n) => <option key={n} value={n}>{n}</option>)}</select>
                      <button type="button" onClick={addUpdateNutrition}>Select Nutrient</button>
                    </div>
                  ) : null}
                  {!updateModal.form.nutritionList.length ? <p className="muted">No nutrition added yet.</p> : null}
                  <NutritionSummaryCards
                    items={updateModal.form.nutritionList}
                    onRemove={(index) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, nutritionList: prev.form.nutritionList.filter((_, idx) => idx !== index) } }))}
                    onValueChange={(index, value) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, nutritionList: prev.form.nutritionList.map((item, idx) => idx === index ? { ...item, value } : item) } }))}
                    onUnitChange={(index, unit) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, nutritionList: prev.form.nutritionList.map((item, idx) => idx === index ? { ...item, unit } : item) } }))}
                  />
                </div>
              </div>
            ) : null}

            {updateModal.type === 'recipe' ? (
              <div className="form">
                <select value={updateModal.form.foodId} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, foodId: e.target.value } }))}>
                  <option value="">Select food</option>
                  {foods.map((food) => <option key={getItemId(food)} value={getItemId(food)}>{food.name}</option>)}
                </select>
                <input placeholder="Version" value={updateModal.form.version} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, version: e.target.value } }))} />
                <input placeholder="Description" value={updateModal.form.description} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, description: e.target.value } }))} />
                <div className="summary-box">
                  <div className="summary-head">
                    <strong>Ingredients</strong>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setUpdateModal((prev) => ({
                          ...prev,
                          form: {
                            ...prev.form,
                            ingredients: [...(prev.form.ingredients || []), { ingredientId: '', quantity: '', unit: 'G', note: '' }]
                          }
                        }))
                      }
                    >
                      Add Ingredient
                    </button>
                  </div>
                  {updateModal.form.ingredients.map((ri, index) => (
                    <div key={`upd-ri-${index}`} className="summary-row">
                      <select value={ri.ingredientId} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, ingredients: prev.form.ingredients.map((x, idx) => idx === index ? { ...x, ingredientId: e.target.value } : x) } }))}>{ingredients.map((ing) => <option key={getItemId(ing)} value={getItemId(ing)}>{ing.name}</option>)}</select>
                      <input type="number" value={ri.quantity} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, ingredients: prev.form.ingredients.map((x, idx) => idx === index ? { ...x, quantity: e.target.value } : x) } }))} />
                      <select value={ri.unit} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, ingredients: prev.form.ingredients.map((x, idx) => idx === index ? { ...x, unit: e.target.value } : x) } }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                      <input value={ri.note} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, ingredients: prev.form.ingredients.map((x, idx) => idx === index ? { ...x, note: e.target.value } : x) } }))} />
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          setUpdateModal((prev) => ({
                            ...prev,
                            form: { ...prev.form, ingredients: prev.form.ingredients.filter((_, idx) => idx !== index) }
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="summary-box">
                  <div className="summary-head">
                    <strong>Instructions</strong>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setUpdateModal((prev) => ({
                          ...prev,
                          form: {
                            ...prev.form,
                            instructions: [...(prev.form.instructions || []), { description: '', tutorialVideoUrl: '' }]
                          }
                        }))
                      }
                    >
                      Add Step
                    </button>
                  </div>
                  {updateModal.form.instructions.map((ins, index) => (
                    <div key={`upd-ins-${index}`} className="summary-row">
                      <input type="number" value={index + 1} readOnly />
                      <input value={ins.description} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, instructions: prev.form.instructions.map((x, idx) => idx === index ? { ...x, description: e.target.value } : x) } }))} />
                      <input value={ins.tutorialVideoUrl} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, instructions: prev.form.instructions.map((x, idx) => idx === index ? { ...x, tutorialVideoUrl: e.target.value } : x) } }))} />
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          setUpdateModal((prev) => ({
                            ...prev,
                            form: { ...prev.form, instructions: prev.form.instructions.filter((_, idx) => idx !== index) }
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="detail-actions">
              <button onClick={() => setUpdateModal({ open: false, type: '', title: '', itemId: null, form: null })}>Cancel</button>
              <button className="secondary" onClick={confirmUpdate}>Update</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
