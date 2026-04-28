import { useEffect, useRef } from 'react';
import type {
  BackendExplorerCreateFlow,
  CreateModalState,
  Food,
  Ingredient
} from '../types';
import CreateFoodForm from './CreateFoodForm';
import CreateIngredientForm from './CreateIngredientForm';
import CreateRecipeForm from './CreateRecipeForm';

interface CreateEntityModalProps {
  createModal: CreateModalState;
  createError: string;
  closeCreateModal: () => void;
  foodFlow: BackendExplorerCreateFlow['food'];
  ingredientFlow: BackendExplorerCreateFlow['ingredient'];
  recipeFlow: BackendExplorerCreateFlow['recipe'];
  unitOptions: readonly string[];
  foods: Food[];
  getItemId: (item: Food | Ingredient) => string | number | undefined;
  ingredients: Ingredient[];
}

export default function CreateEntityModal({
  createModal,
  createError,
  closeCreateModal,
  foodFlow,
  ingredientFlow,
  recipeFlow,
  unitOptions,
  foods,
  getItemId,
  ingredients
}: CreateEntityModalProps) {
  const actionErrorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!createError || !actionErrorRef.current) return;
    requestAnimationFrame(() => {
      actionErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [createError]);

  if (!createModal.open) return null;
  const createAction = createModal.type === 'food'
    ? foodFlow.create
    : createModal.type === 'ingredient'
      ? ingredientFlow.create
      : recipeFlow.create;

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

        {createModal.type === 'food' ? <CreateFoodForm foodFlow={foodFlow} /> : null}
        {createModal.type === 'ingredient' ? (
          <CreateIngredientForm ingredientFlow={ingredientFlow} unitOptions={unitOptions} />
        ) : null}
        {createModal.type === 'recipe' ? (
          <CreateRecipeForm
            recipeFlow={recipeFlow}
            foods={foods}
            ingredients={ingredients}
            unitOptions={unitOptions}
            getItemId={getItemId}
          />
        ) : null}

        {createError ? <p ref={actionErrorRef} className="error">{createError}</p> : null}
        <div className="detail-actions">
          <button className="cancel-btn" onClick={closeCreateModal}>Cancel</button>
          <button onClick={createAction}>Create</button>
        </div>
      </div>
    </div>
  );
}
