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
  NutrientPicker,
  NutritionSummaryCards,
  confirmUpdate
}) {
  if (!updateModal.open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card modal-large">
        <h3>{updateModal.title}</h3>
        {updateModal.type === 'ingredient' ? (
          <div className="form">
            <input placeholder="Name" value={updateModal.form.name} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, name: e.target.value } }))} />
            <input placeholder="Category" value={updateModal.form.category} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, category: e.target.value } }))} />
            <input placeholder="Description" value={updateModal.form.description} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, description: e.target.value } }))} />
            <div className="summary-row">
              <input type="number" placeholder="Serving Amount" value={updateModal.form.servingAmount} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, servingAmount: e.target.value } }))} />
              <select value={updateModal.form.servingUnit} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, servingUnit: e.target.value } }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
            </div>
            <input placeholder="Image URL" value={updateModal.form.imageUrl} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, imageUrl: e.target.value } }))} />
            <div className="summary-box">
              <strong>Nutrition</strong>
              <div className="nutrition-builder">
                <NutrientPicker value={updateNutritionDraft.nutrient} onChange={(nutrient) => setUpdateNutritionDraft((prev) => ({ ...prev, nutrient }))} storageKey="update" />
                <div className="nutrition-builder-actions">
                  <input type="number" placeholder="Amount" value={updateNutritionDraft.value} onChange={(e) => setUpdateNutritionDraft((prev) => ({ ...prev, value: e.target.value }))} />
                  <select value={updateNutritionDraft.unit} onChange={(e) => setUpdateNutritionDraft((prev) => ({ ...prev, unit: e.target.value }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                  <button type="button" onClick={addUpdateNutrition}>Add Nutrition</button>
                </div>
              </div>
              {!updateModal.form.nutritionList.length ? <p className="muted">No nutrition added yet.</p> : null}
              <NutritionSummaryCards
                items={updateModal.form.nutritionList}
                onRemove={(index) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, nutritionList: prev.form.nutritionList.filter((_, idx) => idx !== index) } }))}
                onValueChange={(index, value) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, nutritionList: prev.form.nutritionList.map((item, idx) => idx === index ? { ...item, value } : item) } }))}
                onUnitChange={(index, unit) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, nutritionList: prev.form.nutritionList.map((item, idx) => idx === index ? { ...item, unit } : item) } }))}
              />
            </div>
          </div>
        ) : null}

        {updateModal.type === 'recipe' ? (
          <div className="form">
            <select value={updateModal.form.foodId} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, foodId: e.target.value } }))}>
              <option value="">Select food</option>
              {foods.map((food) => <option key={getItemId(food)} value={getItemId(food)}>{food.name}</option>)}
            </select>
            <input placeholder="Version" value={updateModal.form.version} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, version: e.target.value } }))} />
            <input placeholder="Description" value={updateModal.form.description} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, description: e.target.value } }))} />
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
                        ...prev.form,
                        ingredients: [...(prev.form.ingredients || []), { ingredientId: '', quantity: '', unit: 'G', note: '' }]
                      }
                    }))
                  }
                >
                  Add Ingredient
                </button>
              </div>
              {updateModal.form.ingredients.map((ri, index) => (
                <div key={`upd-ri-${index}`} className="summary-row">
                  <select value={ri.ingredientId} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, ingredients: prev.form.ingredients.map((x, idx) => idx === index ? { ...x, ingredientId: e.target.value } : x) } }))}>{ingredients.map((ing) => <option key={getItemId(ing)} value={getItemId(ing)}>{ing.name}</option>)}</select>
                  <input type="number" value={ri.quantity} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, ingredients: prev.form.ingredients.map((x, idx) => idx === index ? { ...x, quantity: e.target.value } : x) } }))} />
                  <select value={ri.unit} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, ingredients: prev.form.ingredients.map((x, idx) => idx === index ? { ...x, unit: e.target.value } : x) } }))}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                  <input value={ri.note} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, ingredients: prev.form.ingredients.map((x, idx) => idx === index ? { ...x, note: e.target.value } : x) } }))} />
                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      setUpdateModal((prev) => ({
                        ...prev,
                        form: { ...prev.form, ingredients: prev.form.ingredients.filter((_, idx) => idx !== index) }
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
                        ...prev.form,
                        instructions: [...(prev.form.instructions || []), { description: '', tutorialVideoUrl: '' }]
                      }
                    }))
                  }
                >
                  Add Step
                </button>
              </div>
              {updateModal.form.instructions.map((ins, index) => (
                <div key={`upd-ins-${index}`} className="summary-row">
                  <input type="number" value={index + 1} readOnly />
                  <input value={ins.description} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, instructions: prev.form.instructions.map((x, idx) => idx === index ? { ...x, description: e.target.value } : x) } }))} />
                  <input value={ins.tutorialVideoUrl} onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, instructions: prev.form.instructions.map((x, idx) => idx === index ? { ...x, tutorialVideoUrl: e.target.value } : x) } }))} />
                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      setUpdateModal((prev) => ({
                        ...prev,
                        form: { ...prev.form, instructions: prev.form.instructions.filter((_, idx) => idx !== index) }
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
