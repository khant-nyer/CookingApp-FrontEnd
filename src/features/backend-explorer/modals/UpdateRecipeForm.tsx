import type {
  Food,
  Ingredient,
  InputChangeEvent,
  RecipeUpdateForm,
  UpdateModalState,
  Updater
} from '../types';

interface UpdateRecipeFormProps {
  form: RecipeUpdateForm;
  setUpdateModal: (value: Updater<UpdateModalState>) => void;
  foods: Food[];
  ingredients: Ingredient[];
  unitOptions: readonly string[];
  getItemId: (item: Food | Ingredient) => string | number | undefined;
}

export default function UpdateRecipeForm({
  form,
  setUpdateModal,
  foods,
  ingredients,
  unitOptions,
  getItemId
}: UpdateRecipeFormProps) {
  return (
    <div className="form">
      <select
        value={form.foodId}
        onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
          ...prev,
          form: { ...(prev.form as RecipeUpdateForm), foodId: event.target.value }
        }))}
      >
        <option value="">Select food</option>
        {foods.map((food) => (
          <option key={getItemId(food)} value={getItemId(food)}>{food.name}</option>
        ))}
      </select>
      <input
        placeholder="Version"
        value={form.version}
        onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
          ...prev,
          form: { ...(prev.form as RecipeUpdateForm), version: event.target.value }
        }))}
      />
      <input
        placeholder="Description"
        value={form.description}
        onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
          ...prev,
          form: { ...(prev.form as RecipeUpdateForm), description: event.target.value }
        }))}
      />
      <div className="summary-box">
        <div className="summary-head">
          <strong>Ingredients</strong>
          <button
            type="button"
            className="secondary"
            onClick={() => setUpdateModal((prev) => ({
              ...prev,
              form: {
                ...(prev.form as RecipeUpdateForm),
                ingredients: [...((prev.form as RecipeUpdateForm).ingredients || []), { ingredientId: '', quantity: '', unit: 'G', note: '' }]
              }
            }))}
          >
            Add Ingredient
          </button>
        </div>
        {form.ingredients.map((recipeIngredient, index) => (
          <div key={`upd-ri-${index}`} className="summary-row">
            <select
              value={recipeIngredient.ingredientId}
              onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
                ...prev,
                form: {
                  ...(prev.form as RecipeUpdateForm),
                  ingredients: (prev.form as RecipeUpdateForm).ingredients.map((item, idx) => (
                    idx === index ? { ...item, ingredientId: event.target.value } : item
                  ))
                }
              }))}
            >
              <option value="">Ingredient</option>
              {ingredients.map((ingredient) => (
                <option key={getItemId(ingredient)} value={getItemId(ingredient)}>{ingredient.name}</option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              className="quantity-input"
              value={recipeIngredient.quantity}
              placeholder="Quantity"
              onChange={(event: InputChangeEvent) => {
                const value = event.target.value;
                if (value === '' || Number(value) >= 0) {
                  setUpdateModal((prev) => ({
                    ...prev,
                    form: {
                      ...(prev.form as RecipeUpdateForm),
                      ingredients: (prev.form as RecipeUpdateForm).ingredients.map((item, idx) => (
                        idx === index ? { ...item, quantity: value } : item
                      ))
                    }
                  }));
                }
              }}
            />
            <select
              value={recipeIngredient.unit}
              onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
                ...prev,
                form: {
                  ...(prev.form as RecipeUpdateForm),
                  ingredients: (prev.form as RecipeUpdateForm).ingredients.map((item, idx) => (
                    idx === index ? { ...item, unit: event.target.value } : item
                  ))
                }
              }))}
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            <input
              placeholder="Note"
              value={recipeIngredient.note}
              onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
                ...prev,
                form: {
                  ...(prev.form as RecipeUpdateForm),
                  ingredients: (prev.form as RecipeUpdateForm).ingredients.map((item, idx) => (
                    idx === index ? { ...item, note: event.target.value } : item
                  ))
                }
              }))}
            />
            <button
              type="button"
              className="danger"
              onClick={() => setUpdateModal((prev) => ({
                ...prev,
                form: {
                  ...(prev.form as RecipeUpdateForm),
                  ingredients: (prev.form as RecipeUpdateForm).ingredients.filter((_, idx) => idx !== index)
                }
              }))}
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
            onClick={() => setUpdateModal((prev) => ({
              ...prev,
              form: {
                ...(prev.form as RecipeUpdateForm),
                instructions: [...((prev.form as RecipeUpdateForm).instructions || []), { description: '', tutorialVideoUrl: '' }]
              }
            }))}
          >
            Add Step
          </button>
        </div>
        {form.instructions.map((instruction, index) => (
          <div key={`upd-ins-${index}`} className="summary-row">
            <input type="number" value={index + 1} readOnly />
            <input
              placeholder="Instruction description"
              value={instruction.description}
              onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
                ...prev,
                form: {
                  ...(prev.form as RecipeUpdateForm),
                  instructions: (prev.form as RecipeUpdateForm).instructions.map((item, idx) => (
                    idx === index ? { ...item, description: event.target.value } : item
                  ))
                }
              }))}
            />
            <input
              placeholder="Tutorial video URL (optional)"
              value={instruction.tutorialVideoUrl}
              onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
                ...prev,
                form: {
                  ...(prev.form as RecipeUpdateForm),
                  instructions: (prev.form as RecipeUpdateForm).instructions.map((item, idx) => (
                    idx === index ? { ...item, tutorialVideoUrl: event.target.value } : item
                  ))
                }
              }))}
            />
            <button
              type="button"
              className="danger"
              onClick={() => setUpdateModal((prev) => ({
                ...prev,
                form: {
                  ...(prev.form as RecipeUpdateForm),
                  instructions: (prev.form as RecipeUpdateForm).instructions.filter((_, idx) => idx !== index)
                }
              }))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
