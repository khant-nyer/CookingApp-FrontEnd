import { useCallback, useRef, useState } from 'react';
import type { BackendExplorerCreateFlow, InputChangeEvent } from '../types';
import { NutrientPicker, NutritionSummaryCards } from '../shared/ExplorerShared';

interface CreateIngredientFormProps {
  ingredientFlow: BackendExplorerCreateFlow['ingredient'];
  unitOptions: readonly string[];
}

export default function CreateIngredientForm({
  ingredientFlow,
  unitOptions
}: CreateIngredientFormProps) {
  const [nutritionError, setNutritionError] = useState('');
  const nutritionActionRef = useRef<HTMLDivElement>(null);
  const {
    form,
    setForm,
    nutritions,
    setNutritions,
    nutritionDraft,
    setNutritionDraft,
    addNutrition
  } = ingredientFlow;

  const scrollToNutritionAction = useCallback(() => {
    if (!nutritionActionRef.current) return;
    requestAnimationFrame(() => {
      nutritionActionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const handleAddNutrition = useCallback(() => {
    if (!nutritionDraft.value) {
      setNutritionError('Nutrition value is required.');
      scrollToNutritionAction();
      return;
    }
    if (Number.isNaN(Number(nutritionDraft.value))) {
      setNutritionError('Nutrition value must be a valid number.');
      scrollToNutritionAction();
      return;
    }
    setNutritionError('');
    addNutrition();
  }, [addNutrition, nutritionDraft.value, scrollToNutritionAction]);

  return (
    <>
      <form className="form" onSubmit={(event) => event.preventDefault()}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          placeholder="Category"
          value={form.category}
          onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, category: event.target.value }))}
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
        <input
          placeholder="Serving Amount"
          type="number"
          value={form.servingAmount}
          onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, servingAmount: event.target.value }))}
        />
        <select
          value={form.servingUnit}
          onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, servingUnit: event.target.value }))}
        >
          {unitOptions.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
        <input
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
        />
      </form>

      <h4>Add Nutrition</h4>
      <div className="summary-box">
        <strong>Nutrition Summary (Editable)</strong>
        {!nutritions.length ? <p className="muted">No nutrition added yet.</p> : null}
        <NutritionSummaryCards
          items={nutritions}
          onRemove={(index) => setNutritions((prev) => prev.filter((_, idx) => idx !== index))}
          onValueChange={(index, value) => setNutritions((prev) => prev.map((item, idx) => (
            idx === index ? { ...item, value: Number(value) } : item
          )))}
          onUnitChange={(index, unit) => setNutritions((prev) => prev.map((item, idx) => (
            idx === index ? { ...item, unit } : item
          )))}
        />
      </div>
      <div ref={nutritionActionRef} className="nutrition-builder">
        <NutrientPicker
          value={nutritionDraft.nutrient}
          onChange={(nutrient) => {
            setNutritionError('');
            setNutritionDraft((prev) => ({ ...prev, nutrient }));
          }}
          storageKey="create"
        />
        <div className="nutrition-builder-actions">
          <input
            type="number"
            placeholder="Amount"
            value={nutritionDraft.value}
            onChange={(event: InputChangeEvent) => {
              setNutritionError('');
              setNutritionDraft((prev) => ({ ...prev, value: event.target.value }));
            }}
          />
          <select
            value={nutritionDraft.unit}
            onChange={(event: InputChangeEvent) => {
              setNutritionError('');
              setNutritionDraft((prev) => ({ ...prev, unit: event.target.value }));
            }}
          >
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
          <button type="button" onClick={handleAddNutrition}>Add Nutrition</button>
        </div>
      </div>
      {nutritionError ? <p className="error">{nutritionError}</p> : null}
    </>
  );
}
