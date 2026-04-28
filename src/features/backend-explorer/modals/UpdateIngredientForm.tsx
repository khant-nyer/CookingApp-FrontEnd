import { useCallback, useRef, useState } from 'react';
import type {
  BackendExplorerUpdateFlow,
  IngredientUpdateForm,
  InputChangeEvent,
  UpdateModalState,
  Updater
} from '../types';
import { NutrientPicker, NutritionSummaryCards } from '../shared/ExplorerShared';

interface UpdateIngredientFormProps {
  form: IngredientUpdateForm;
  setUpdateModal: (value: Updater<UpdateModalState>) => void;
  ingredientFlow: BackendExplorerUpdateFlow['ingredient'];
  unitOptions: readonly string[];
}

export default function UpdateIngredientForm({
  form,
  setUpdateModal,
  ingredientFlow,
  unitOptions
}: UpdateIngredientFormProps) {
  const [nutritionError, setNutritionError] = useState('');
  const nutritionActionRef = useRef<HTMLDivElement>(null);
  const { nutritionDraft, setNutritionDraft, addNutrition } = ingredientFlow;

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
    <div className="form">
      <input
        placeholder="Name"
        value={form.name}
        onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
          ...prev,
          form: { ...(prev.form as IngredientUpdateForm), name: event.target.value }
        }))}
      />
      <input
        placeholder="Category"
        value={form.category}
        onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
          ...prev,
          form: { ...(prev.form as IngredientUpdateForm), category: event.target.value }
        }))}
      />
      <input
        placeholder="Description"
        value={form.description}
        onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
          ...prev,
          form: { ...(prev.form as IngredientUpdateForm), description: event.target.value }
        }))}
      />
      <div className="summary-row">
        <input
          type="number"
          placeholder="Serving Amount"
          value={form.servingAmount}
          onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
            ...prev,
            form: { ...(prev.form as IngredientUpdateForm), servingAmount: event.target.value }
          }))}
        />
        <select
          value={form.servingUnit}
          onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
            ...prev,
            form: { ...(prev.form as IngredientUpdateForm), servingUnit: event.target.value }
          }))}
        >
          {unitOptions.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </div>
      <input
        placeholder="Image URL"
        value={form.imageUrl}
        onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
          ...prev,
          form: { ...(prev.form as IngredientUpdateForm), imageUrl: event.target.value }
        }))}
      />
      <div className="summary-box">
        <strong>Nutrition</strong>
        <div ref={nutritionActionRef} className="nutrition-builder">
          <NutrientPicker
            value={nutritionDraft.nutrient}
            onChange={(nutrient) => {
              setNutritionError('');
              setNutritionDraft((prev) => ({ ...prev, nutrient }));
            }}
            storageKey="update"
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
        {!form.nutritionList.length ? <p className="muted">No nutrition added yet.</p> : null}
        <NutritionSummaryCards
          items={form.nutritionList}
          onRemove={(index) => setUpdateModal((prev) => ({
            ...prev,
            form: {
              ...(prev.form as IngredientUpdateForm),
              nutritionList: (prev.form as IngredientUpdateForm).nutritionList.filter((_, idx) => idx !== index)
            }
          }))}
          onValueChange={(index, value) => setUpdateModal((prev) => ({
            ...prev,
            form: {
              ...(prev.form as IngredientUpdateForm),
              nutritionList: (prev.form as IngredientUpdateForm).nutritionList.map((item, idx) => (
                idx === index ? { ...item, value } : item
              ))
            }
          }))}
          onUnitChange={(index, unit) => setUpdateModal((prev) => ({
            ...prev,
            form: {
              ...(prev.form as IngredientUpdateForm),
              nutritionList: (prev.form as IngredientUpdateForm).nutritionList.map((item, idx) => (
                idx === index ? { ...item, unit } : item
              ))
            }
          }))}
        />
      </div>
    </div>
  );
}
