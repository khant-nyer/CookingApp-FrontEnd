import { useCallback, useMemo, useRef, useState } from 'react';
import type { BackendExplorerCreateFlow, Food, Ingredient, InputChangeEvent } from '../types';
import { RecipeIngredientSummaryCards } from '../shared/ExplorerShared';

interface CreateRecipeFormProps {
  recipeFlow: BackendExplorerCreateFlow['recipe'];
  foods: Food[];
  ingredients: Ingredient[];
  unitOptions: readonly string[];
  getItemId: (item: Food | Ingredient) => string | number | undefined;
}

export default function CreateRecipeForm({
  recipeFlow,
  foods,
  ingredients,
  unitOptions,
  getItemId
}: CreateRecipeFormProps) {
  const [ingredientError, setIngredientError] = useState('');
  const [instructionError, setInstructionError] = useState('');
  const ingredientActionRef = useRef<HTMLDivElement>(null);
  const instructionActionRef = useRef<HTMLDivElement>(null);
  const recipeIngredientSource = useMemo(() => ingredients, [ingredients]);
  const {
    form,
    setForm,
    ingredients: recipeIngredients,
    setIngredients,
    ingredientDraft,
    setIngredientDraft,
    addIngredient,
    instructionDraft,
    setInstructionDraft,
    addInstruction,
    instructions,
    setInstructions
  } = recipeFlow;

  const scrollToSection = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const handleAddIngredient = useCallback(() => {
    if (!ingredientDraft.ingredientId || !ingredientDraft.quantity) {
      setIngredientError('Recipe ingredient needs ingredient and quantity.');
      scrollToSection(ingredientActionRef.current);
      return;
    }
    setIngredientError('');
    addIngredient();
  }, [addIngredient, ingredientDraft.ingredientId, ingredientDraft.quantity, scrollToSection]);

  const handleAddInstruction = useCallback(() => {
    if (!instructionDraft.description.trim()) {
      setInstructionError('Instruction description is required.');
      scrollToSection(instructionActionRef.current);
      return;
    }
    setInstructionError('');
    addInstruction();
  }, [addInstruction, instructionDraft.description, scrollToSection]);

  return (
    <>
      <form className="form" onSubmit={(event) => event.preventDefault()}>
        <select
          value={form.foodId}
          onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, foodId: event.target.value }))}
        >
          <option value="">Select food</option>
          {foods.map((food) => (
            <option key={getItemId(food)} value={getItemId(food)}>{food.name}</option>
          ))}
        </select>
        <input
          placeholder="Version"
          value={form.version}
          onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, version: event.target.value }))}
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
      </form>

      <h4>Add Ingredient</h4>
      <p className="muted">If you don't find ingredient in the list, you can create one in ingredient tab.</p>
      <div className="summary-box">
        <strong>Recipe Ingredients Summary (Editable)</strong>
        {!recipeIngredients.length ? <p className="muted">No recipe ingredients added yet.</p> : null}
        <RecipeIngredientSummaryCards
          items={recipeIngredients}
          ingredients={recipeIngredientSource}
          onChange={(index, patch) => setIngredients((prev) => prev.map((current, idx) => (
            idx === index ? { ...current, ...patch } : current
          )))}
          onRemove={(index) => setIngredients((prev) => prev.filter((_, idx) => idx !== index))}
        />
      </div>
      <div ref={ingredientActionRef} className="inline-builder">
        <select
          value={ingredientDraft.ingredientId}
          onChange={(event: InputChangeEvent) => {
            setIngredientError('');
            setIngredientDraft((prev) => ({ ...prev, ingredientId: event.target.value }));
          }}
        >
          <option value="">Ingredient</option>
          {recipeIngredientSource.map((ingredient) => (
            <option key={getItemId(ingredient)} value={getItemId(ingredient)}>{ingredient.name}</option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          className="quantity-input"
          placeholder="Quantity"
          value={ingredientDraft.quantity}
          onChange={(event: InputChangeEvent) => {
            const value = event.target.value;
            if (value === '' || Number(value) >= 0) {
              setIngredientError('');
              setIngredientDraft((prev) => ({ ...prev, quantity: value }));
            }
          }}
        />
        <select
          value={ingredientDraft.unit}
          onChange={(event: InputChangeEvent) => {
            setIngredientError('');
            setIngredientDraft((prev) => ({ ...prev, unit: event.target.value }));
          }}
        >
          {unitOptions.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
        <input
          placeholder="Note"
          value={ingredientDraft.note}
          onChange={(event: InputChangeEvent) => {
            setIngredientError('');
            setIngredientDraft((prev) => ({ ...prev, note: event.target.value }));
          }}
        />
        <button type="button" onClick={handleAddIngredient}>Add Ingredient</button>
      </div>
      {ingredientError ? <p className="error">{ingredientError}</p> : null}

      <h4>Add Instruction</h4>
      <div ref={instructionActionRef} className="inline-builder">
        <input
          placeholder="Instruction description"
          value={instructionDraft.description}
          onChange={(event: InputChangeEvent) => {
            setInstructionError('');
            setInstructionDraft((prev) => ({ ...prev, description: event.target.value }));
          }}
        />
        <input
          placeholder="Tutorial video URL (optional)"
          value={instructionDraft.tutorialVideoUrl}
          onChange={(event: InputChangeEvent) => {
            setInstructionError('');
            setInstructionDraft((prev) => ({ ...prev, tutorialVideoUrl: event.target.value }));
          }}
        />
        <button type="button" onClick={handleAddInstruction}>Add Instruction</button>
      </div>
      {instructionError ? <p className="error">{instructionError}</p> : null}

      <div className="summary-box">
        <strong>Recipe Instructions Summary (Editable)</strong>
        {!instructions.length ? <p className="muted">No instructions added yet.</p> : null}
        {instructions.map((item, index) => (
          <div key={`recipe-instruction-${index}`} className="summary-row">
            <input type="number" value={index + 1} readOnly />
            <input
              value={item.description}
              onChange={(event: InputChangeEvent) => setInstructions((prev) => prev.map((current, idx) => (
                idx === index ? { ...current, description: event.target.value } : current
              )))}
            />
            <input
              value={item.tutorialVideoUrl || ''}
              onChange={(event: InputChangeEvent) => setInstructions((prev) => prev.map((current, idx) => (
                idx === index ? { ...current, tutorialVideoUrl: event.target.value } : current
              )))}
            />
            <button className="danger" onClick={() => setInstructions((prev) => prev.filter((_, idx) => idx !== index))}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
