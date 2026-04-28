import { useEffect, useRef } from 'react';
import type {
  BackendExplorerUpdateFlow,
  Food,
  FoodUpdateForm,
  Ingredient,
  IngredientUpdateForm,
  RecipeUpdateForm,
  UpdateModalState,
  Updater
} from '../types';
import UpdateFoodForm from './UpdateFoodForm';
import UpdateIngredientForm from './UpdateIngredientForm';
import UpdateRecipeForm from './UpdateRecipeForm';

interface UpdateEntityModalProps {
  updateModal: UpdateModalState;
  errorMessage: string;
  setUpdateModal: (value: Updater<UpdateModalState>) => void;
  closeUpdateModal: () => void;
  unitOptions: readonly string[];
  foods: Food[];
  ingredients: Ingredient[];
  getItemId: (item: Food | Ingredient) => string | number | undefined;
  ingredientFlow: BackendExplorerUpdateFlow['ingredient'];
  confirmUpdate: () => void;
}

export default function UpdateEntityModal({
  updateModal,
  errorMessage,
  setUpdateModal,
  closeUpdateModal,
  unitOptions,
  foods,
  ingredients,
  getItemId,
  ingredientFlow,
  confirmUpdate
}: UpdateEntityModalProps) {
  const actionErrorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!errorMessage || !actionErrorRef.current) return;
    requestAnimationFrame(() => {
      actionErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [errorMessage]);

  if (!updateModal.open) return null;

  const ingredientForm = updateModal.type === 'ingredient' ? updateModal.form as IngredientUpdateForm : null;
  const foodForm = updateModal.type === 'food' ? updateModal.form as FoodUpdateForm : null;
  const recipeForm = updateModal.type === 'recipe' ? updateModal.form as RecipeUpdateForm : null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card modal-large">
        <h3>{updateModal.title}</h3>
        {updateModal.type === 'ingredient' && ingredientForm ? (
          <UpdateIngredientForm
            form={ingredientForm}
            setUpdateModal={setUpdateModal}
            ingredientFlow={ingredientFlow}
            unitOptions={unitOptions}
          />
        ) : null}

        {updateModal.type === 'food' && foodForm ? (
          <UpdateFoodForm form={foodForm} setUpdateModal={setUpdateModal} />
        ) : null}

        {updateModal.type === 'recipe' && recipeForm ? (
          <UpdateRecipeForm
            form={recipeForm}
            setUpdateModal={setUpdateModal}
            foods={foods}
            ingredients={ingredients}
            unitOptions={unitOptions}
            getItemId={getItemId}
          />
        ) : null}

        {errorMessage ? <p ref={actionErrorRef} className="error">{errorMessage}</p> : null}
        <div className="detail-actions">
          <button className="cancel-btn" onClick={closeUpdateModal}>Cancel</button>
          <button className="secondary" onClick={confirmUpdate}>Update</button>
        </div>
      </div>
    </div>
  );
}
