import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const tabs = ['foods', 'ingredients', 'recipes', 'nutrition'];
const nutrientOptions = [
  'PROTEIN',
  'CARBOHYDRATES',
  'FAT',
  'FIBER',
  'DIETARY_FIBER',
  'SUGAR',
  'CALORIES',
  'SATURATED_FAT',
  'TRANS_FAT',
  'OMEGA_3',
  'OMEGA_6',
  'SODIUM',
  'POTASSIUM',
  'CALCIUM',
  'IRON',
  'MAGNESIUM',
  'ZINC',
  'VITAMIN_A',
  'VITAMIN_B1',
  'VITAMIN_B2',
  'VITAMIN_B3',
  'VITAMIN_B6',
  'VITAMIN_B9',
  'SELENIUM',
  'VITAMIN_C',
  'VITAMIN_D',
  'VITAMIN_E',
  'VITAMIN_K',
  'VITAMIN_B12'
];

const unitOptions = ['G', 'KG', 'MG', 'MCG', 'ML', 'L', 'TSP', 'TBSP', 'CUP', 'OZ', 'LB', 'PIECE', 'PINCH', 'CLOVE', 'SLICE'];

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
  const [selectedNutrient, setSelectedNutrient] = useState('CALORIES');

  const [foodForm, setFoodForm] = useState({ name: '', category: '', imageUrl: '' });
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    category: '',
    description: '',
    servingAmount: '100',
    servingUnit: 'G',
    imageUrl: ''
  });
  const [nutritionDraft, setNutritionDraft] = useState({ nutrient: 'CALORIES', value: '', unit: 'G' });
  const [ingredientNutritions, setIngredientNutritions] = useState([]);

  const [recipeForm, setRecipeForm] = useState({ foodId: '', version: 'v1', description: '' });
  const [recipeIngredientDraft, setRecipeIngredientDraft] = useState({
    ingredientId: '',
    quantity: '',
    unit: 'G',
    note: ''
  });
  const [recipeInstructionDraft, setRecipeInstructionDraft] = useState({ description: '', tutorialVideoUrl: '' });
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [recipeInstructions, setRecipeInstructions] = useState([]);

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

  function addNutrition() {
    if (!nutritionDraft.value) {
      setError('Nutrition value is required.');
      return;
    }
    setIngredientNutritions((prev) => [
      ...prev,
      {
        nutrient: nutritionDraft.nutrient,
        value: Number(nutritionDraft.value),
        unit: nutritionDraft.unit
      }
    ]);
    setNutritionDraft((prev) => ({ ...prev, value: '' }));
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
        servingUnit: ingredientForm.servingUnit || 'G',
        imageUrl: ingredientForm.imageUrl.trim() || null,
        nutritionList: ingredientNutritions,
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
    setIngredientNutritions([]);
    setNutritionDraft({ nutrient: 'CALORIES', value: '', unit: 'G' });
  }

  function addRecipeIngredient() {
    if (!recipeIngredientDraft.ingredientId || !recipeIngredientDraft.quantity) {
      setError('Recipe ingredient needs ingredient and quantity.');
      return;
    }
    const ingredientId = Number(recipeIngredientDraft.ingredientId);
    setRecipeIngredients((prev) => [
      ...prev,
      {
        ingredientId,
        ingredientName: ingredients.find((item) => String(getItemId(item)) === String(ingredientId))?.name || '',
        quantity: Number(recipeIngredientDraft.quantity),
        unit: recipeIngredientDraft.unit || 'G',
        note: recipeIngredientDraft.note || ''
      }
    ]);
    setRecipeIngredientDraft({ ingredientId: '', quantity: '', unit: 'G', note: '' });
  }

  function addRecipeInstruction() {
    if (!recipeInstructionDraft.description.trim()) {
      setError('Instruction description is required.');
      return;
    }
    setRecipeInstructions((prev) => [
      ...prev,
      {
        step: prev.length + 1,
        description: recipeInstructionDraft.description.trim(),
        tutorialVideoUrl: recipeInstructionDraft.tutorialVideoUrl.trim() || null
      }
    ]);
    setRecipeInstructionDraft({ description: '', tutorialVideoUrl: '' });
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
    if (!recipeIngredients.length) {
      setError('Please add at least one recipe ingredient.');
      return;
    }
    if (!recipeInstructions.length) {
      setError('Please add at least one recipe instruction.');
      return;
    }

    await run(() =>
      api.createRecipeForFoodViaRecipeApi(recipeForm.foodId, {
        version: recipeForm.version.trim(),
        description: recipeForm.description.trim(),
        foodId: Number(recipeForm.foodId),
        ingredients: recipeIngredients.map(({ ingredientId, quantity, unit, note }) => ({
          ingredientId,
          quantity: Number(quantity),
          unit,
          note
        })),
        instructions: recipeInstructions.map((item, index) => ({
          stepNumber: index + 1,
          description: item.description,
          tutorialVideoUrl: item.tutorialVideoUrl
        }))
      })
    );

    setRecipeForm({ foodId: '', version: 'v1', description: '' });
    setRecipeIngredients([]);
    setRecipeInstructions([]);
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

  const nutrientFilteredIngredients = useMemo(
    () =>
      ingredients.filter((ingredient) =>
        Array.isArray(ingredient?.nutritionList) &&
        ingredient.nutritionList.some((nutrition) => nutrition?.nutrient === selectedNutrient)
      ),
    [ingredients, selectedNutrient]
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
            <DetailCard
              title={selectedFood.name || 'Food details'}
              payload={selectedFood}
              onDelete={() => run(() => api.deleteFood(getItemId(selectedFood)))}
            />
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
              <select
                value={ingredientForm.servingUnit}
                onChange={(event) => setIngredientForm((prev) => ({ ...prev, servingUnit: event.target.value }))}
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <input
                placeholder="Image URL"
                value={ingredientForm.imageUrl}
                onChange={(event) => setIngredientForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              />
            </div>

            <h4>Add Nutrition</h4>
            <div className="inline-builder">
              <select
                value={nutritionDraft.nutrient}
                onChange={(event) => setNutritionDraft((prev) => ({ ...prev, nutrient: event.target.value }))}
              >
                {nutrientOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Value"
                value={nutritionDraft.value}
                onChange={(event) => setNutritionDraft((prev) => ({ ...prev, value: event.target.value }))}
              />
              <select
                value={nutritionDraft.unit}
                onChange={(event) => setNutritionDraft((prev) => ({ ...prev, unit: event.target.value }))}
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <button onClick={addNutrition}>Add Nutrition</button>
            </div>

            <div className="summary-box">
              <strong>Nutrition Summary (Editable)</strong>
              {!ingredientNutritions.length ? <p className="muted">No nutrition added yet.</p> : null}
              {ingredientNutritions.map((nutrition, index) => (
                <div key={`${nutrition.nutrient}-${index}`} className="summary-row">
                  <select
                    value={nutrition.nutrient}
                    onChange={(event) =>
                      setIngredientNutritions((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, nutrient: event.target.value } : item
                        )
                      )
                    }
                  >
                    {nutrientOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={nutrition.value}
                    onChange={(event) =>
                      setIngredientNutritions((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, value: Number(event.target.value) } : item
                        )
                      )
                    }
                  />
                  <select
                    value={nutrition.unit}
                    onChange={(event) =>
                      setIngredientNutritions((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, unit: event.target.value } : item
                        )
                      )
                    }
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <button
                    className="danger"
                    onClick={() =>
                      setIngredientNutritions((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button onClick={createIngredient}>Create Ingredient</button>

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
            </div>

            <h4>Add Recipe Ingredient</h4>
            <div className="inline-builder">
              <select
                value={recipeIngredientDraft.ingredientId}
                onChange={(event) =>
                  setRecipeIngredientDraft((prev) => ({ ...prev, ingredientId: event.target.value }))
                }
              >
                <option value="">Select ingredient</option>
                {ingredients.map((ingredient) => (
                  <option key={getItemId(ingredient)} value={getItemId(ingredient)}>
                    {ingredient.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={recipeIngredientDraft.quantity}
                onChange={(event) =>
                  setRecipeIngredientDraft((prev) => ({ ...prev, quantity: event.target.value }))
                }
              />
              <select
                value={recipeIngredientDraft.unit}
                onChange={(event) =>
                  setRecipeIngredientDraft((prev) => ({ ...prev, unit: event.target.value }))
                }
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <input
                placeholder="Note"
                value={recipeIngredientDraft.note}
                onChange={(event) => setRecipeIngredientDraft((prev) => ({ ...prev, note: event.target.value }))}
              />
              <button onClick={addRecipeIngredient}>Add Ingredient</button>
            </div>

            <div className="summary-box">
              <strong>Recipe Ingredients Summary (Editable)</strong>
              {!recipeIngredients.length ? <p className="muted">No recipe ingredients added yet.</p> : null}
              {recipeIngredients.map((item, index) => (
                <div key={`recipe-ingredient-${index}`} className="summary-row">
                  <select
                    value={item.ingredientId}
                    onChange={(event) =>
                      setRecipeIngredients((prev) =>
                        prev.map((current, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...current,
                                ingredientId: Number(event.target.value),
                                ingredientName:
                                  ingredients.find(
                                    (candidate) => String(getItemId(candidate)) === String(event.target.value)
                                  )?.name || ''
                              }
                            : current
                        )
                      )
                    }
                  >
                    {ingredients.map((ingredient) => (
                      <option key={getItemId(ingredient)} value={getItemId(ingredient)}>
                        {ingredient.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(event) =>
                      setRecipeIngredients((prev) =>
                        prev.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, quantity: Number(event.target.value) } : current
                        )
                      )
                    }
                  />
                  <select
                    value={item.unit}
                    onChange={(event) =>
                      setRecipeIngredients((prev) =>
                        prev.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, unit: event.target.value } : current
                        )
                      )
                    }
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <input
                    value={item.note || ''}
                    onChange={(event) =>
                      setRecipeIngredients((prev) =>
                        prev.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, note: event.target.value } : current
                        )
                      )
                    }
                  />
                  <button
                    className="danger"
                    onClick={() =>
                      setRecipeIngredients((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <h4>Add Instruction</h4>
            <div className="inline-builder">
              <input
                placeholder="Instruction description"
                value={recipeInstructionDraft.description}
                onChange={(event) =>
                  setRecipeInstructionDraft((prev) => ({ ...prev, description: event.target.value }))
                }
              />
              <input
                placeholder="Tutorial video URL (optional)"
                value={recipeInstructionDraft.tutorialVideoUrl}
                onChange={(event) =>
                  setRecipeInstructionDraft((prev) => ({ ...prev, tutorialVideoUrl: event.target.value }))
                }
              />
              <button onClick={addRecipeInstruction}>Add Instruction</button>
            </div>

            <div className="summary-box">
              <strong>Recipe Instructions Summary (Editable)</strong>
              {!recipeInstructions.length ? <p className="muted">No instructions added yet.</p> : null}
              {recipeInstructions.map((item, index) => (
                <div key={`recipe-instruction-${index}`} className="summary-row">
                  <input type="number" value={index + 1} readOnly />
                  <input
                    value={item.description}
                    onChange={(event) =>
                      setRecipeInstructions((prev) =>
                        prev.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, description: event.target.value } : current
                        )
                      )
                    }
                  />
                  <input
                    value={item.tutorialVideoUrl || ''}
                    onChange={(event) =>
                      setRecipeInstructions((prev) =>
                        prev.map((current, currentIndex) =>
                          currentIndex === index
                            ? { ...current, tutorialVideoUrl: event.target.value }
                            : current
                        )
                      )
                    }
                  />
                  <button
                    className="danger"
                    onClick={() =>
                      setRecipeInstructions((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button onClick={createRecipe}>Create Recipe</button>

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

      {activeTab === 'nutrition' && (
        <div className="grid">
          <div className="card">
            <h3>Nutrients</h3>
            <p className="muted">Select a nutrient to view ingredients containing it.</p>
            <div className="nutrient-grid">
              {nutrientOptions.map((nutrient) => (
                <button
                  key={nutrient}
                  className={nutrient === selectedNutrient ? 'tab active' : 'tab'}
                  onClick={() => setSelectedNutrient(nutrient)}
                >
                  {nutrient}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Ingredients with {selectedNutrient}</h3>
            {!nutrientFilteredIngredients.length ? (
              <p className="muted">No ingredients found with this nutrient.</p>
            ) : null}
            <div className="gallery-grid">
              {nutrientFilteredIngredients.map((ingredient) => (
                <GalleryTile
                  key={getItemId(ingredient) || ingredient.name}
                  imageUrl={ingredient.imageUrl}
                  fallbackText={ingredient.name || 'Unnamed ingredient'}
                  subtitle={(() => {
                    const match = ingredient.nutritionList?.find((item) => item.nutrient === selectedNutrient);
                    return match ? `${match.value} ${match.unit}` : '';
                  })()}
                  onClick={() => setActiveTab('ingredients')}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
