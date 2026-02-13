import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const tabs = ['foods', 'ingredients', 'recipes'];

function getItemId(item) {
  return item?.id || item?._id;
}

function getRecipeTileId(recipe, index) {
  return getItemId(recipe) || `${recipe?.foodId || 'food'}-${recipe?.version || 'version'}-${index}`;
}

function GalleryTile({ imageUrl, fallbackText, onClick, isSelected, subtitle }) {
  return (
    <button className={isSelected ? 'gallery-tile selected' : 'gallery-tile'} onClick={onClick}>
      {imageUrl ? (
        <img src={imageUrl} alt={fallbackText} className="gallery-image" />
      ) : (
        <div className="gallery-fallback">{fallbackText}</div>
      )}
      <div className="gallery-caption">{fallbackText}</div>
      {subtitle ? <div className="gallery-subtitle">{subtitle}</div> : null}
    </button>
  );
}

function DetailCard({ title, payload, onDelete }) {
  return (
    <div className="card detail-card">
      <h3>{title}</h3>
      <pre>{JSON.stringify(payload, null, 2)}</pre>
      <div className="detail-actions">
        <button className="danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function BackendExplorer() {
  const [activeTab, setActiveTab] = useState('foods');
  const [foods, setFoods] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  const [foodForm, setFoodForm] = useState({ name: '', category: '', imageUrl: '' });
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    category: '',
    description: '',
    servingAmount: '100',
    servingUnit: 'G',
    imageUrl: ''
  });
  const [recipeForm, setRecipeForm] = useState({
    foodId: '',
    version: 'v1',
    description: '',
    ingredientId: '',
    quantity: '100',
    unit: 'G',
    instruction: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [foodData, ingredientData, recipeData] = await Promise.all([
        api.getFoods(),
        api.getIngredients(),
        api.getRecipes()
      ]);
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
    loadAll();
  }, []);

  useEffect(() => {
    setSelectedId('');
  }, [activeTab]);

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

  async function createFood() {
    if (!foodForm.name.trim()) {
      setError('Food name is required.');
      return;
    }
    await run(() =>
      api.createFood({
        name: foodForm.name.trim(),
        category: foodForm.category.trim(),
        imageUrl: foodForm.imageUrl.trim() || null,
        recipes: []
      })
    );
    setFoodForm({ name: '', category: '', imageUrl: '' });
  }

  async function createIngredient() {
    if (!ingredientForm.name.trim()) {
      setError('Ingredient name is required.');
      return;
    }
    await run(() =>
      api.createIngredient({
        name: ingredientForm.name.trim(),
        category: ingredientForm.category.trim(),
        description: ingredientForm.description.trim(),
        servingAmount: Number(ingredientForm.servingAmount || 0),
        servingUnit: ingredientForm.servingUnit.trim() || 'G',
        imageUrl: ingredientForm.imageUrl.trim() || null,
        nutritionList: [],
        nearbyStoreListings: []
      })
    );
    setIngredientForm({
      name: '',
      category: '',
      description: '',
      servingAmount: '100',
      servingUnit: 'G',
      imageUrl: ''
    });
  }

  async function createRecipe() {
    if (!recipeForm.foodId) {
      setError('Please select food for recipe.');
      return;
    }
    if (!recipeForm.version.trim()) {
      setError('Recipe version is required.');
      return;
    }

    const ingredientId = Number(recipeForm.ingredientId);
    await run(() =>
      api.createRecipeForFoodViaRecipeApi(recipeForm.foodId, {
        version: recipeForm.version.trim(),
        description: recipeForm.description.trim(),
        foodId: Number(recipeForm.foodId),
        ingredients: Number.isFinite(ingredientId)
          ? [
              {
                ingredientId,
                quantity: Number(recipeForm.quantity || 0),
                unit: recipeForm.unit.trim() || 'G'
              }
            ]
          : [],
        instructions: recipeForm.instruction.trim()
          ? [{ stepNumber: 1, description: recipeForm.instruction.trim() }]
          : []
      })
    );
  }

  const selectedFood = useMemo(() => foods.find((item) => String(getItemId(item)) === String(selectedId)), [foods, selectedId]);
  const selectedIngredient = useMemo(
    () => ingredients.find((item) => String(getItemId(item)) === String(selectedId)),
    [ingredients, selectedId]
  );
  const selectedRecipe = useMemo(
    () => recipes.find((item, index) => String(getRecipeTileId(item, index)) === String(selectedId)),
    [recipes, selectedId]
  );

  return (
    <section>
      <nav className="nav-row">
        {tabs.map((tab) => (
          <button key={tab} className={tab === activeTab ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
        <button onClick={loadAll}>{loading ? 'Loading…' : 'Refresh all'}</button>
      </nav>

      {error && <p className="error">{error}</p>}

      {activeTab === 'foods' && (
        <div className="grid">
          <div className="card">
            <h3>Create Food</h3>
            <div className="form">
              <input
                placeholder="Name"
                value={foodForm.name}
                onChange={(event) => setFoodForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                placeholder="Category"
                value={foodForm.category}
                onChange={(event) => setFoodForm((prev) => ({ ...prev, category: event.target.value }))}
              />
              <input
                placeholder="Image URL"
                value={foodForm.imageUrl}
                onChange={(event) => setFoodForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              />
              <button onClick={createFood}>Create Food</button>
            </div>

            <div className="gallery-grid">
              {foods.map((food) => {
                const id = getItemId(food);
                return (
                  <GalleryTile
                    key={id || food.name}
                    imageUrl={food.imageUrl}
                    fallbackText={food.name || 'Unnamed food'}
                    isSelected={String(id) === String(selectedId)}
                    onClick={() => setSelectedId(id)}
                  />
                );
              })}
            </div>
          </div>

          {selectedFood ? (
            <DetailCard title={selectedFood.name || 'Food details'} payload={selectedFood} onDelete={() => run(() => api.deleteFood(getItemId(selectedFood)))} />
          ) : (
            <div className="card muted">Select a food image to view details.</div>
          )}
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div className="grid">
          <div className="card">
            <h3>Create Ingredient</h3>
            <div className="form">
              <input
                placeholder="Name"
                value={ingredientForm.name}
                onChange={(event) => setIngredientForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                placeholder="Category"
                value={ingredientForm.category}
                onChange={(event) => setIngredientForm((prev) => ({ ...prev, category: event.target.value }))}
              />
              <input
                placeholder="Description"
                value={ingredientForm.description}
                onChange={(event) => setIngredientForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <input
                placeholder="Serving Amount"
                type="number"
                value={ingredientForm.servingAmount}
                onChange={(event) => setIngredientForm((prev) => ({ ...prev, servingAmount: event.target.value }))}
              />
              <input
                placeholder="Serving Unit"
                value={ingredientForm.servingUnit}
                onChange={(event) => setIngredientForm((prev) => ({ ...prev, servingUnit: event.target.value }))}
              />
              <input
                placeholder="Image URL"
                value={ingredientForm.imageUrl}
                onChange={(event) => setIngredientForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              />
              <button onClick={createIngredient}>Create Ingredient</button>
            </div>

            <div className="gallery-grid">
              {ingredients.map((ingredient) => {
                const id = getItemId(ingredient);
                return (
                  <GalleryTile
                    key={id || ingredient.name}
                    imageUrl={ingredient.imageUrl}
                    fallbackText={ingredient.name || 'Unnamed ingredient'}
                    isSelected={String(id) === String(selectedId)}
                    onClick={() => setSelectedId(id)}
                  />
                );
              })}
            </div>
          </div>

          {selectedIngredient ? (
            <DetailCard
              title={selectedIngredient.name || 'Ingredient details'}
              payload={selectedIngredient}
              onDelete={() => run(() => api.deleteIngredient(getItemId(selectedIngredient)))}
            />
          ) : (
            <div className="card muted">Select an ingredient image to view details.</div>
          )}
        </div>
      )}

      {activeTab === 'recipes' && (
        <div className="grid">
          <div className="card">
            <h3>Create Recipe</h3>
            <div className="form">
              <select
                value={recipeForm.foodId}
                onChange={(event) => setRecipeForm((prev) => ({ ...prev, foodId: event.target.value }))}
              >
                <option value="">Select food</option>
                {foods.map((food) => (
                  <option key={getItemId(food)} value={getItemId(food)}>
                    {food.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Version"
                value={recipeForm.version}
                onChange={(event) => setRecipeForm((prev) => ({ ...prev, version: event.target.value }))}
              />
              <input
                placeholder="Description"
                value={recipeForm.description}
                onChange={(event) => setRecipeForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <select
                value={recipeForm.ingredientId}
                onChange={(event) => setRecipeForm((prev) => ({ ...prev, ingredientId: event.target.value }))}
              >
                <option value="">Select ingredient (optional)</option>
                {ingredients.map((ingredient) => (
                  <option key={getItemId(ingredient)} value={getItemId(ingredient)}>
                    {ingredient.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Quantity"
                type="number"
                value={recipeForm.quantity}
                onChange={(event) => setRecipeForm((prev) => ({ ...prev, quantity: event.target.value }))}
              />
              <input
                placeholder="Unit"
                value={recipeForm.unit}
                onChange={(event) => setRecipeForm((prev) => ({ ...prev, unit: event.target.value }))}
              />
              <input
                placeholder="Instruction"
                value={recipeForm.instruction}
                onChange={(event) => setRecipeForm((prev) => ({ ...prev, instruction: event.target.value }))}
              />
              <button onClick={createRecipe}>Create Recipe</button>
            </div>

            <div className="gallery-grid">
              {recipes.map((recipe, index) => {
                const id = getRecipeTileId(recipe, index);
                const foodName = recipe.foodName || foods.find((food) => food.id === recipe.foodId)?.name || 'Food';
                return (
                  <GalleryTile
                    key={id}
                    imageUrl={null}
                    fallbackText={foodName}
                    subtitle={recipe.version || 'No version'}
                    isSelected={String(id) === String(selectedId)}
                    onClick={() => setSelectedId(id)}
                  />
                );
              })}
            </div>
          </div>

          {selectedRecipe ? (
            <DetailCard
              title={`${selectedRecipe.foodName || 'Recipe'} ${selectedRecipe.version ? `(${selectedRecipe.version})` : ''}`}
              payload={selectedRecipe}
              onDelete={() => run(() => api.deleteRecipe(getItemId(selectedRecipe)))}
            />
          ) : (
            <div className="card muted">Select a recipe card to view details.</div>
          )}
        </div>
      )}
    </section>
  );
}
