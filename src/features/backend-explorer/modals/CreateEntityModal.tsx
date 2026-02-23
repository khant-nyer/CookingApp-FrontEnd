import type { FormEvent } from 'react';
import type {
  CreateModalState,
  Food,
  FoodForm,
  Ingredient,
  IngredientForm,
  InputChangeEvent,
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

  function preventSubmit(event: FormEvent<HTMLFormElement>) {
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
            <input placeholder="Name" value={foodForm.name} onChange={(event: InputChangeEvent) => setFoodForm((p) => ({ ...p, name: event.target.value }))} />
            <input placeholder="Category" value={foodForm.category} onChange={(event: InputChangeEvent) => setFoodForm((p) => ({ ...p, category: event.target.value }))} />
            <input placeholder="Image URL" value={foodForm.imageUrl} onChange={(event: InputChangeEvent) => setFoodForm((p) => ({ ...p, imageUrl: event.target.value }))} />
          </form>
        ) : null}

        {createModal.type === 'ingredient' ? (
          <>
            <form className="form" onSubmit={preventSubmit}>
              <input placeholder="Name" value={ingredientForm.name} onChange={(event: InputChangeEvent) => setIngredientForm((p) => ({ ...p, name: event.target.value }))} />
              <input placeholder="Category" value={ingredientForm.category} onChange={(event: InputChangeEvent) => setIngredientForm((p) => ({ ...p, category: event.target.value }))} />
              <input placeholder="Description" value={ingredientForm.description} onChange={(event: InputChangeEvent) => setIngredientForm((p) => ({ ...p, description: event.target.value }))} />
              <input placeholder="Serving Amount" type="number" value={ingredientForm.servingAmount} onChange={(event: InputChangeEvent) => setIngredientForm((p) => ({ ...p, servingAmount: event.target.value }))} />
              <select value={ingredientForm.servingUnit} onChange={(event: InputChangeEvent) => setIngredientForm((p) => ({ ...p, servingUnit: event.target.value }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
              <input placeholder="Image URL" value={ingredientForm.imageUrl} onChange={(event: InputChangeEvent) => setIngredientForm((p) => ({ ...p, imageUrl: event.target.value }))} />
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
                <input type="number" placeholder="Amount" value={nutritionDraft.value} onChange={(event: InputChangeEvent) => setNutritionDraft((p) => ({ ...p, value: event.target.value }))} />
                <select value={nutritionDraft.unit} onChange={(event: InputChangeEvent) => setNutritionDraft((p) => ({ ...p, unit: event.target.value }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                <button onClick={addNutrition}>Add Nutrition</button>
              </div>
            </div>
          </>
        ) : null}

        {createModal.type === 'recipe' ? (
          <>
            <form className="form" onSubmit={preventSubmit}>
              <select value={recipeForm.foodId} onChange={(event: InputChangeEvent) => setRecipeForm((p) => ({ ...p, foodId: event.target.value }))}>
                <option value="">Select food</option>
                {foods.map((food) => <option key={getItemId(food)} value={getItemId(food)}>{food.name}</option>)}
              </select>
              <input placeholder="Version" value={recipeForm.version} onChange={(event: InputChangeEvent) => setRecipeForm((p) => ({ ...p, version: event.target.value }))} />
              <input placeholder="Description" value={recipeForm.description} onChange={(event: InputChangeEvent) => setRecipeForm((p) => ({ ...p, description: event.target.value }))} />
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
              <select value={recipeIngredientDraft.ingredientId} onChange={(event: InputChangeEvent) => setRecipeIngredientDraft((p) => ({ ...p, ingredientId: event.target.value }))}>
                <option value="">Ingredient</option>
                {ingredients.map((ingredient) => <option key={getItemId(ingredient)} value={getItemId(ingredient)}>{ingredient.name}</option>)}
              </select>
              <input type="number" placeholder="Quantity" value={recipeIngredientDraft.quantity} onChange={(event: InputChangeEvent) => setRecipeIngredientDraft((p) => ({ ...p, quantity: event.target.value }))} />
              <select value={recipeIngredientDraft.unit} onChange={(event: InputChangeEvent) => setRecipeIngredientDraft((p) => ({ ...p, unit: event.target.value }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
              <input placeholder="Note" value={recipeIngredientDraft.note} onChange={(event: InputChangeEvent) => setRecipeIngredientDraft((p) => ({ ...p, note: event.target.value }))} />
              <button onClick={addRecipeIngredient}>Add Ingredient</button>
            </div>

            <h4>Add Instruction</h4>
            <div className="inline-builder">
              <input placeholder="Instruction description" value={recipeInstructionDraft.description} onChange={(event: InputChangeEvent) => setRecipeInstructionDraft((p) => ({ ...p, description: event.target.value }))} />
              <input placeholder="Tutorial video URL (optional)" value={recipeInstructionDraft.tutorialVideoUrl} onChange={(event: InputChangeEvent) => setRecipeInstructionDraft((p) => ({ ...p, tutorialVideoUrl: event.target.value }))} />
              <button onClick={addRecipeInstruction}>Add Instruction</button>
            </div>

            <div className="summary-box">
              <strong>Recipe Instructions Summary (Editable)</strong>
              {!recipeInstructions.length ? <p className="muted">No instructions added yet.</p> : null}
              {recipeInstructions.map((item, index) => (
                <div key={`recipe-instruction-${index}`} className="summary-row">
                  <input type="number" value={index + 1} readOnly />
                  <input value={item.description} onChange={(event: InputChangeEvent) => setRecipeInstructions((prev) => prev.map((current, idx) => idx === index ? { ...current, description: event.target.value } : current))} />
                  <input value={item.tutorialVideoUrl || ''} onChange={(event: InputChangeEvent) => setRecipeInstructions((prev) => prev.map((current, idx) => idx === index ? { ...current, tutorialVideoUrl: event.target.value } : current))} />
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
