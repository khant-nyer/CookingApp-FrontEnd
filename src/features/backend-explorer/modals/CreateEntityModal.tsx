import type { FormEvent } from 'react';
import type {
  CreateModalState,
  Food,
  FoodForm,
  Ingredient,
  IngredientForm,
  IngredientNutrition,
  NutritionDraft,
  RecipeForm,
  RecipeIngredientDraft,
  RecipeIngredientItem,
  RecipeInstructionDraft,
  RecipeInstructionItem,
  StateSetter
} from '../types';
import { NutrientPicker, NutritionSummaryCards, RecipeIngredientSummaryCards } from '../shared/ExplorerShared';

interface CreateEntityModalProps {
  createModal: CreateModalState;
  createError: string;
  closeCreateModal: () => void;
  createFood: () => void;
  createIngredient: () => void;
  createRecipe: () => void;
  foodForm: FoodForm;
  setFoodForm: StateSetter<FoodForm>;
  ingredientForm: IngredientForm;
  setIngredientForm: StateSetter<IngredientForm>;
  ingredientNutritions: IngredientNutrition[];
  setIngredientNutritions: StateSetter<IngredientNutrition[]>;
  nutritionDraft: NutritionDraft;
  setNutritionDraft: StateSetter<NutritionDraft>;
  unitOptions: readonly string[];
  addNutrition: () => void;
  recipeForm: RecipeForm;
  setRecipeForm: StateSetter<RecipeForm>;
  foods: Food[];
  getItemId: (item: Food | Ingredient) => string | number | undefined;
  recipeIngredients: RecipeIngredientItem[];
  setRecipeIngredients: StateSetter<RecipeIngredientItem[]>;
  ingredients: Ingredient[];
  recipeIngredientDraft: RecipeIngredientDraft;
  setRecipeIngredientDraft: StateSetter<RecipeIngredientDraft>;
  addRecipeIngredient: () => void;
  recipeInstructionDraft: RecipeInstructionDraft;
  setRecipeInstructionDraft: StateSetter<RecipeInstructionDraft>;
  addRecipeInstruction: () => void;
  recipeInstructions: RecipeInstructionItem[];
  setRecipeInstructions: StateSetter<RecipeInstructionItem[]>;
}

export default function CreateEntityModal({
  createModal,
  createError,
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
  unitOptions,
  addNutrition,
  recipeForm,
  setRecipeForm,
  foods,
  getItemId,
  recipeIngredients,
  setRecipeIngredients,
  ingredients,
  recipeIngredientDraft,
  setRecipeIngredientDraft,
  addRecipeIngredient,
  recipeInstructionDraft,
  setRecipeInstructionDraft,
  addRecipeInstruction,
  recipeInstructions,
  setRecipeInstructions
}: CreateEntityModalProps) {
  if (!createModal.open) return null;

  function preventSubmit(event: FormEvent) {
    event.preventDefault();
  }

  return (
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
          <form className="form" onSubmit={preventSubmit}>
            <input placeholder="Name" value={foodForm.name} onChange={(e) => setFoodForm((p) => ({ ...p, name: e.target.value }))} />
            <input placeholder="Category" value={foodForm.category} onChange={(e) => setFoodForm((p) => ({ ...p, category: e.target.value }))} />
            <input placeholder="Image URL" value={foodForm.imageUrl} onChange={(e) => setFoodForm((p) => ({ ...p, imageUrl: e.target.value }))} />
          </form>
        ) : null}

        {createModal.type === 'ingredient' ? (
          <>
            <form className="form" onSubmit={preventSubmit}>
              <input placeholder="Name" value={ingredientForm.name} onChange={(e) => setIngredientForm((p) => ({ ...p, name: e.target.value }))} />
              <input placeholder="Category" value={ingredientForm.category} onChange={(e) => setIngredientForm((p) => ({ ...p, category: e.target.value }))} />
              <input placeholder="Description" value={ingredientForm.description} onChange={(e) => setIngredientForm((p) => ({ ...p, description: e.target.value }))} />
              <input placeholder="Serving Amount" type="number" value={ingredientForm.servingAmount} onChange={(e) => setIngredientForm((p) => ({ ...p, servingAmount: e.target.value }))} />
              <select value={ingredientForm.servingUnit} onChange={(e) => setIngredientForm((p) => ({ ...p, servingUnit: e.target.value }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
              <input placeholder="Image URL" value={ingredientForm.imageUrl} onChange={(e) => setIngredientForm((p) => ({ ...p, imageUrl: e.target.value }))} />
            </form>

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
            <div className="nutrition-builder">
              <NutrientPicker value={nutritionDraft.nutrient} onChange={(nutrient) => setNutritionDraft((p) => ({ ...p, nutrient }))} storageKey="create" />
              <div className="nutrition-builder-actions">
                <input type="number" placeholder="Amount" value={nutritionDraft.value} onChange={(e) => setNutritionDraft((p) => ({ ...p, value: e.target.value }))} />
                <select value={nutritionDraft.unit} onChange={(e) => setNutritionDraft((p) => ({ ...p, unit: e.target.value }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                <button onClick={addNutrition}>Add Nutrition</button>
              </div>
            </div>
          </>
        ) : null}

        {createModal.type === 'recipe' ? (
          <>
            <form className="form" onSubmit={preventSubmit}>
              <select value={recipeForm.foodId} onChange={(e) => setRecipeForm((p) => ({ ...p, foodId: e.target.value }))}>
                <option value="">Select food</option>
                {foods.map((food) => <option key={getItemId(food)} value={getItemId(food)}>{food.name}</option>)}
              </select>
              <input placeholder="Version" value={recipeForm.version} onChange={(e) => setRecipeForm((p) => ({ ...p, version: e.target.value }))} />
              <input placeholder="Description" value={recipeForm.description} onChange={(e) => setRecipeForm((p) => ({ ...p, description: e.target.value }))} />
            </form>

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
  );
}
