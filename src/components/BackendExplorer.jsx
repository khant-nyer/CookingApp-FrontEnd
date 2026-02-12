import { useEffect, useState } from 'react';
import { api } from '../services/api';

function JsonEditor({ value, onChange }) {
  return (
    <textarea
      rows={7}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="json-editor"
      spellCheck={false}
    />
  );
}

function parseJson(value) {
  try {
    return { data: JSON.parse(value), error: '' };
  } catch {
    return { data: null, error: 'Invalid JSON payload.' };
  }
}

function ListCard({ title, items, onDelete, idKeys = ['id'] }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {!items.length && <p className="muted">No records.</p>}
      <ul className="recipe-list">
        {items.map((item, index) => {
          const itemId = idKeys.map((key) => item?.[key]).find(Boolean);
          return (
            <li key={itemId || index}>
              <pre>{JSON.stringify(item, null, 2)}</pre>
              {onDelete && itemId ? (
                <button className="danger" onClick={() => onDelete(itemId)}>
                  Delete
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function BackendExplorer() {
  const [activeTab, setActiveTab] = useState('foods');
  const [foods, setFoods] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);

  const [foodPayload, setFoodPayload] = useState(
    '{\n  "name": "Tom Yum",\n  "category": "Thai",\n  "recipes": []\n}'
  );
  const [ingredientPayload, setIngredientPayload] = useState(
    '{\n  "name": "Shrimp",\n  "category": "Seafood",\n  "description": "Fresh shrimp",\n  "servingAmount": 100,\n  "servingUnit": "G",\n  "nutritionList": [],\n  "nearbyStoreListings": []\n}'
  );
  const [recipePayload, setRecipePayload] = useState(
    '{\n  "version": "v1",\n  "description": "Boil broth, add herbs, season, then add shrimp.",\n  "foodId": 1,\n  "ingredients": [\n    {\n      "ingredientId": 1,\n      "quantity": 100,\n      "unit": "G"\n    }\n  ],\n  "instructions": [\n    {\n      "stepNumber": 1,\n      "description": "Prepare ingredients"\n    },\n    {\n      "stepNumber": 2,\n      "description": "Cook and season"\n    }\n  ]\n}'
  );

  const [ingredientQuery, setIngredientQuery] = useState('shrimp');
  const [nutritionQuery, setNutritionQuery] = useState({ nutrient: 'protein', minValue: '10' });
  const [discoverQuery, setDiscoverQuery] = useState({ ingredientName: 'shrimp', city: 'Bangkok', userId: '' });

  const [searchResults, setSearchResults] = useState([]);
  const [nutritionResults, setNutritionResults] = useState([]);
  const [discoverResults, setDiscoverResults] = useState([]);
  const [foodRecipeStatus, setFoodRecipeStatus] = useState(null);
  const [foodStatusId, setFoodStatusId] = useState('1');

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
    const parsed = parseJson(foodPayload);
    if (parsed.error) return setError(parsed.error);
    await run(() => api.createFood(parsed.data));
  }

  async function createIngredient() {
    const parsed = parseJson(ingredientPayload);
    if (parsed.error) return setError(parsed.error);
    await run(() => api.createIngredient(parsed.data));
  }

  async function createRecipe() {
    const parsed = parseJson(recipePayload);
    if (parsed.error) return setError(parsed.error);
    await run(() => api.createRecipe(parsed.data));
  }

  async function getFoodStatus() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getFoodRecipeStatus(foodStatusId);
      setFoodRecipeStatus(data);
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setLoading(false);
    }
  }

  async function searchByName() {
    setLoading(true);
    setError('');
    try {
      setSearchResults(await api.searchIngredientsByName(ingredientQuery));
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function searchByNutrition() {
    setLoading(true);
    setError('');
    try {
      setNutritionResults(
        await api.searchIngredientsByNutrition(nutritionQuery.nutrient, nutritionQuery.minValue)
      );
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function discoverSupermarkets() {
    setLoading(true);
    setError('');
    try {
      setDiscoverResults(
        await api.discoverSupermarkets(discoverQuery.ingredientName, discoverQuery.city, discoverQuery.userId)
      );
    } catch (discoverError) {
      setError(discoverError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="tab-row">
        {['foods', 'ingredients', 'recipes'].map((tab) => (
          <button
            key={tab}
            className={tab === activeTab ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
        <button onClick={loadAll}>{loading ? 'Loading…' : 'Refresh all'}</button>
      </div>

      {error && <p className="error">{error}</p>}

      {activeTab === 'foods' && (
        <div className="grid">
          <div className="card">
            <h3>Create food (POST /api/foods)</h3>
            <p className="muted">Required: <code>name</code>. Optional: <code>category</code>, <code>recipes</code>.</p>
            <JsonEditor value={foodPayload} onChange={setFoodPayload} />
            <button onClick={createFood}>Create food</button>

            <h3>Food recipe status (GET /api/foods/{'{id}'}/recipe-status)</h3>
            <input value={foodStatusId} onChange={(e) => setFoodStatusId(e.target.value)} placeholder="Food ID" />
            <button onClick={getFoodStatus}>Get status</button>
            {foodRecipeStatus && <pre>{JSON.stringify(foodRecipeStatus, null, 2)}</pre>}
          </div>

          <ListCard title="Foods" items={foods} onDelete={(id) => run(() => api.deleteFood(id))} />
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div className="grid">
          <div className="card">
            <h3>Create ingredient (POST /api/ingredients)</h3>
            <p className="muted">
              Required: <code>name</code>, <code>servingAmount</code>, <code>servingUnit</code>.
            </p>
            <JsonEditor value={ingredientPayload} onChange={setIngredientPayload} />
            <button onClick={createIngredient}>Create ingredient</button>

            <h3>Search by name</h3>
            <input value={ingredientQuery} onChange={(e) => setIngredientQuery(e.target.value)} />
            <button onClick={searchByName}>Search</button>
            {searchResults.length > 0 && <pre>{JSON.stringify(searchResults, null, 2)}</pre>}

            <h3>Search by nutrition</h3>
            <input
              value={nutritionQuery.nutrient}
              onChange={(e) => setNutritionQuery((prev) => ({ ...prev, nutrient: e.target.value }))}
              placeholder="nutrient"
            />
            <input
              value={nutritionQuery.minValue}
              onChange={(e) => setNutritionQuery((prev) => ({ ...prev, minValue: e.target.value }))}
              placeholder="minValue"
            />
            <button onClick={searchByNutrition}>Search nutrition</button>
            {nutritionResults.length > 0 && <pre>{JSON.stringify(nutritionResults, null, 2)}</pre>}

            <h3>Discover supermarkets</h3>
            <input
              value={discoverQuery.ingredientName}
              onChange={(e) => setDiscoverQuery((prev) => ({ ...prev, ingredientName: e.target.value }))}
              placeholder="ingredientName"
            />
            <input
              value={discoverQuery.city}
              onChange={(e) => setDiscoverQuery((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="city"
            />
            <input
              value={discoverQuery.userId}
              onChange={(e) => setDiscoverQuery((prev) => ({ ...prev, userId: e.target.value }))}
              placeholder="userId (optional)"
            />
            <button onClick={discoverSupermarkets}>Discover</button>
            {discoverResults.length > 0 && <pre>{JSON.stringify(discoverResults, null, 2)}</pre>}
          </div>

          <ListCard
            title="Ingredients"
            items={ingredients}
            onDelete={(id) => run(() => api.deleteIngredient(id))}
          />
        </div>
      )}

      {activeTab === 'recipes' && (
        <div className="grid">
          <div className="card">
            <h3>Create recipe (POST /api/recipes)</h3>
            <p className="muted">
              Required: <code>version</code>, at least one <code>ingredients</code> item, and one{' '}
              <code>instructions</code> item.
            </p>
            <JsonEditor value={recipePayload} onChange={setRecipePayload} />
            <button onClick={createRecipe}>Create recipe</button>
          </div>

          <ListCard title="Recipes" items={recipes} onDelete={(id) => run(() => api.deleteRecipe(id))} />
        </div>
      )}
    </section>
  );
}
