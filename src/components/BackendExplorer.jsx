import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import {
  nutrientCatalog,
  nutrientGroups,
  nutrientIcons,
  nutrientOptions,
  nutrientShortNames
} from '../features/backend-explorer/constants/nutrients';
import { unitOptions } from '../features/backend-explorer/constants/units';
import { getItemId, getRecipeTileId } from '../features/backend-explorer/utils/ids';
import { normalizeNutrientKey } from '../features/backend-explorer/utils/nutrients';
import CreateEntityModal from '../features/backend-explorer/modals/CreateEntityModal';
import DeleteConfirmModal from '../features/backend-explorer/modals/DeleteConfirmModal';
import UpdateEntityModal from '../features/backend-explorer/modals/UpdateEntityModal';

const tabs = ['foods', 'ingredients', 'recipes', 'nutrition'];

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

function NutrientPicker({ value, onChange, storageKey = 'default' }) {
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedQuery) return nutrientCatalog;
    return nutrientCatalog.filter((item) => {
      const name = item.key.toLowerCase();
      const noUnderscore = item.key.replace(/_/g, ' ').toLowerCase();
      const short = (item.short || '').toLowerCase();
      const aliases = (item.aliases || []).join(' ').toLowerCase();
      return name.includes(normalizedQuery)
        || noUnderscore.includes(normalizedQuery)
        || short.includes(normalizedQuery)
        || aliases.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const recent = useMemo(() => {
    try {
      const raw = localStorage.getItem(`nutrient-recent-${storageKey}`);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => nutrientOptions.includes(item)) : [];
    } catch {
      return [];
    }
  }, [storageKey, value]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [normalizedQuery]);

  function selectNutrient(nutrient) {
    onChange(nutrient);
    setQuery('');
    try {
      const next = [nutrient, ...recent.filter((item) => item !== nutrient)].slice(0, 6);
      localStorage.setItem(`nutrient-recent-${storageKey}`, JSON.stringify(next));
    } catch {
      // ignore localStorage issues
    }
  }

  function onKeyDown(event) {
    if (!filtered.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      selectNutrient(filtered[highlightIndex].key);
    }
  }

  return (
    <div className="nutrient-picker">
      <div className="picker-top-row">
        <div className="picker-chip-section search-block">
          <small className="picker-section-title">Search nutrition</small>
          <input
            placeholder="Search nutrient"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>

        <div className="picker-chip-section">
          <small className="picker-section-title">Recent picks</small>
          <div className="picker-recent-row">
            {recent.length ? recent.map((nutrient) => (
              <button
                type="button"
                key={nutrient}
                className={nutrient === value ? 'chip selected' : 'chip'}
                onClick={() => selectNutrient(nutrient)}
              >
                <span className="chip-icon">{nutrientIcons[nutrient] || '🧪'}</span>
                <span className="chip-main">{nutrientShortNames[nutrient] || nutrient}</span>
              </button>
            )) : <small className="muted">No recent picks</small>}
          </div>
        </div>

      </div>

      <div className="picker-list">
        <strong className="picker-list-title">Nutrient List</strong>
        {Object.entries(nutrientGroups)
          .sort(([a], [b]) => {
            if (a === 'Other') return 1;
            if (b === 'Other') return -1;
            return 0;
          })
          .map(([group, keys]) => {
          const groupItems = keys.filter((key) => filtered.some((item) => item.key === key));
          if (!groupItems.length) return null;
          return (
            <div key={group} className="picker-group">
              <strong>{group}</strong>
              {groupItems.map((nutrient) => {
                const idx = filtered.findIndex((item) => item.key === nutrient);
                return (
                  <button
                    type="button"
                    key={nutrient}
                    className={idx === highlightIndex ? 'picker-item highlighted' : 'picker-item'}
                    onClick={() => selectNutrient(nutrient)}
                  >
                    <span>{nutrientIcons[nutrient] || '🧪'}</span>
                    <span>{nutrient}</span>
                    <small>{nutrientShortNames[nutrient]}</small>
                  </button>
                );
              })}
            </div>
          );
        })}
        {!filtered.length ? <p className="muted">No nutrients found.</p> : null}
      </div>
    </div>
  );
}

function NutritionSummaryCards({ items = [], onRemove, onValueChange, onUnitChange }) {
  return (
    <div className="summary-card-grid nutrition-summary-grid">
      {items.map((nutrition, index) => (
        <div key={`${nutrition.nutrient}-${index}`} className="mini-summary-card">
          <button type="button" className="mini-remove" onClick={() => onRemove(index)}>×</button>
          <div className="mini-summary-head nutrition-summary-head">
            <span className="nutrient-icon">{nutrientIcons[nutrition.nutrient] || '🧪'}</span>
            <small className="nutrient-full-name">{nutrition.nutrient}</small>
            <small className="nutrient-short-name">{nutrientShortNames[nutrition.nutrient] || nutrition.nutrient}</small>
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
    <div className="summary-card-grid ingredient-summary-grid">
      {items.map((item, index) => {
        const ingredient = ingredients.find((ing) => String(getItemId(ing)) === String(item.ingredientId));
        return (
          <div key={`recipe-ingredient-${index}`} className="mini-summary-card ingredient-summary-card">
            <button type="button" className="mini-remove" onClick={() => onRemove(index)}>×</button>
            {ingredient?.imageUrl ? <img src={ingredient.imageUrl} alt={ingredient.name || 'Ingredient'} className="mini-ingredient-image" /> : <div className="mini-ingredient-image fallback">🥣</div>}
            <strong className="mini-ingredient-name">{item.ingredientName || ingredient?.name || 'Ingredient'}</strong>
            <div className="mini-summary-fields ingredient-summary-fields">
              <div className="ingredient-amount-row">
                <input type="number" value={item.quantity} onChange={(e) => onChange(index, { quantity: Number(e.target.value) })} placeholder="Amt" />
                <select value={item.unit} onChange={(e) => onChange(index, { unit: e.target.value })}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
              </div>
              <input value={item.note || ''} onChange={(e) => onChange(index, { note: e.target.value })} placeholder="Note" />
              <select value={item.ingredientId} onChange={(e) => onChange(index, { ingredientId: Number(e.target.value), ingredientName: ingredients.find((ing) => String(getItemId(ing)) === String(e.target.value))?.name || '' })}>{ingredients.map((ing) => <option key={getItemId(ing)} value={getItemId(ing)}>{ing.name}</option>)}</select>
            </div>
          </div>
        );
      })}
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
  const [updateNutritionDraft, setUpdateNutritionDraft] = useState({ nutrient: 'CALORIES', value: '', unit: 'G' });
  const [deleteModal, setDeleteModal] = useState({ open: false, message: '', action: null });
  const [updateModal, setUpdateModal] = useState({ open: false, type: '', title: '', itemId: null, form: null });
  const hasLoadedInitiallyRef = useRef(false);

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

  useEffect(() => {
    if (hasLoadedInitiallyRef.current) return;
    hasLoadedInitiallyRef.current = true;
    loadAll();
  }, []);
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
        NutritionSummaryCards={NutritionSummaryCards}
        NutrientPicker={NutrientPicker}
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
        RecipeIngredientSummaryCards={RecipeIngredientSummaryCards}
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
        NutrientPicker={NutrientPicker}
        NutritionSummaryCards={NutritionSummaryCards}
        confirmUpdate={confirmUpdate}
      />

    </section>
  );
}
