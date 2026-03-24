import type { Food, FoodUpdateForm, Ingredient, IngredientUpdateForm, InputChangeEvent, NutritionDraft, RecipeUpdateForm, UpdateModalState, Updater } from '../types';
import { NutrientPicker, NutritionSummaryCards } from '../shared/ExplorerShared';

interface UpdateEntityModalProps {
  updateModal: UpdateModalState;
  setUpdateModal: (value: Updater<UpdateModalState>) => void;
  unitOptions: readonly string[];
  foods: Food[];
  ingredients: Ingredient[];
  getItemId: (item: Food | Ingredient) => string | number | undefined;
  updateNutritionDraft: NutritionDraft;
  setUpdateNutritionDraft: (value: Updater<NutritionDraft>) => void;
  addUpdateNutrition: () => void;
  confirmUpdate: () => void;
}

export default function UpdateEntityModal({
  updateModal,
  setUpdateModal,
  unitOptions,
  foods,
  ingredients,
  getItemId,
  updateNutritionDraft,
  setUpdateNutritionDraft,
  addUpdateNutrition,
  confirmUpdate
}: UpdateEntityModalProps) {
  if (!updateModal.open) return null;

  const ingredientForm = updateModal.type === 'ingredient' ? updateModal.form as IngredientUpdateForm : null;
  const foodForm = updateModal.type === 'food' ? updateModal.form as FoodUpdateForm : null;
  const recipeForm = updateModal.type === 'recipe' ? updateModal.form as RecipeUpdateForm : null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card modal-large">
        <h3>{updateModal.title}</h3>
        {updateModal.type === 'ingredient' && ingredientForm ? (
          <div className="form">
            <input placeholder="Name" value={ingredientForm.name} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as IngredientUpdateForm), name: event.target.value } }))} />
            <input placeholder="Category" value={ingredientForm.category} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as IngredientUpdateForm), category: event.target.value } }))} />
            <input placeholder="Description" value={ingredientForm.description} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as IngredientUpdateForm), description: event.target.value } }))} />
            <div className="summary-row">
              <input type="number" placeholder="Serving Amount" value={ingredientForm.servingAmount} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as IngredientUpdateForm), servingAmount: event.target.value } }))} />
              <select value={ingredientForm.servingUnit} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as IngredientUpdateForm), servingUnit: event.target.value } }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
            </div>
            <input placeholder="Image URL" value={ingredientForm.imageUrl} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as IngredientUpdateForm), imageUrl: event.target.value } }))} />
            <div className="summary-box">
              <strong>Nutrition</strong>
              <div className="nutrition-builder">
                <NutrientPicker value={updateNutritionDraft.nutrient} onChange={(nutrient) => setUpdateNutritionDraft((prev) => ({ ...prev, nutrient }))} storageKey="update" />
                <div className="nutrition-builder-actions">
                  <input type="number" placeholder="Amount" value={updateNutritionDraft.value} onChange={(event: InputChangeEvent) => setUpdateNutritionDraft((prev) => ({ ...prev, value: event.target.value }))} />
                  <select value={updateNutritionDraft.unit} onChange={(event: InputChangeEvent) => setUpdateNutritionDraft((prev) => ({ ...prev, unit: event.target.value }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                  <button type="button" onClick={addUpdateNutrition}>Add Nutrition</button>
                </div>
              </div>
              {!ingredientForm.nutritionList.length ? <p className="muted">No nutrition added yet.</p> : null}
              <NutritionSummaryCards
                items={ingredientForm.nutritionList}
                onRemove={(index) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as IngredientUpdateForm), nutritionList: (prev.form as IngredientUpdateForm).nutritionList.filter((_, idx) => idx !== index) } }))}
                onValueChange={(index, value) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as IngredientUpdateForm), nutritionList: (prev.form as IngredientUpdateForm).nutritionList.map((item, idx) => idx === index ? { ...item, value } : item) } }))}
                onUnitChange={(index, unit) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as IngredientUpdateForm), nutritionList: (prev.form as IngredientUpdateForm).nutritionList.map((item, idx) => idx === index ? { ...item, unit } : item) } }))}
              />
            </div>
          </div>
        ) : null}

        {updateModal.type === 'food' && foodForm ? (
          <div className="form">
            <input placeholder="Name" value={foodForm.name} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as FoodUpdateForm), name: event.target.value } }))} />
            <input placeholder="Category" value={foodForm.category} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as FoodUpdateForm), category: event.target.value } }))} />
            <input placeholder="Image URL" value={foodForm.imageUrl} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as FoodUpdateForm), imageUrl: event.target.value } }))} />
          </div>
        ) : null}

        {updateModal.type === 'recipe' && recipeForm ? (
          <div className="form">
            <select value={recipeForm.foodId} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as RecipeUpdateForm), foodId: event.target.value } }))}>
              <option value="">Select food</option>
              {foods.map((food) => <option key={getItemId(food)} value={getItemId(food)}>{food.name}</option>)}
            </select>
            <input placeholder="Version" value={recipeForm.version} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as RecipeUpdateForm), version: event.target.value } }))} />
            <input placeholder="Description" value={recipeForm.description} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as RecipeUpdateForm), description: event.target.value } }))} />
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
                        ...(prev.form as RecipeUpdateForm),
                        ingredients: [...((prev.form as RecipeUpdateForm).ingredients || []), { ingredientId: '', quantity: '', unit: 'G', note: '' }]
                      }
                    }))
                  }
                >
                  Add Ingredient
                </button>
              </div>
              {recipeForm.ingredients.map((ri, index) => (
                <div key={`upd-ri-${index}`} className="summary-row">
                  <select value={ri.ingredientId} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as RecipeUpdateForm), ingredients: (prev.form as RecipeUpdateForm).ingredients.map((x, idx) => idx === index ? { ...x, ingredientId: event.target.value } : x) } }))}>{ingredients.map((ing) => <option key={getItemId(ing)} value={getItemId(ing)}>{ing.name}</option>)}</select>
                  <input type="number" value={ri.quantity} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as RecipeUpdateForm), ingredients: (prev.form as RecipeUpdateForm).ingredients.map((x, idx) => idx === index ? { ...x, quantity: event.target.value } : x) } }))} />
                  <select value={ri.unit} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as RecipeUpdateForm), ingredients: (prev.form as RecipeUpdateForm).ingredients.map((x, idx) => idx === index ? { ...x, unit: event.target.value } : x) } }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                  <input value={ri.note} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as RecipeUpdateForm), ingredients: (prev.form as RecipeUpdateForm).ingredients.map((x, idx) => idx === index ? { ...x, note: event.target.value } : x) } }))} />
                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      setUpdateModal((prev) => ({
                        ...prev,
                        form: { ...(prev.form as RecipeUpdateForm), ingredients: (prev.form as RecipeUpdateForm).ingredients.filter((_, idx) => idx !== index) }
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
                        ...(prev.form as RecipeUpdateForm),
                        instructions: [...((prev.form as RecipeUpdateForm).instructions || []), { description: '', tutorialVideoUrl: '' }]
                      }
                    }))
                  }
                >
                  Add Step
                </button>
              </div>
              {recipeForm.instructions.map((ins, index) => (
                <div key={`upd-ins-${index}`} className="summary-row">
                  <input type="number" value={index + 1} readOnly />
                  <input value={ins.description} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as RecipeUpdateForm), instructions: (prev.form as RecipeUpdateForm).instructions.map((x, idx) => idx === index ? { ...x, description: event.target.value } : x) } }))} />
                  <input value={ins.tutorialVideoUrl} onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({ ...prev, form: { ...(prev.form as RecipeUpdateForm), instructions: (prev.form as RecipeUpdateForm).instructions.map((x, idx) => idx === index ? { ...x, tutorialVideoUrl: event.target.value } : x) } }))} />
                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      setUpdateModal((prev) => ({
                        ...prev,
                        form: { ...(prev.form as RecipeUpdateForm), instructions: (prev.form as RecipeUpdateForm).instructions.filter((_, idx) => idx !== index) }
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
  );
}
