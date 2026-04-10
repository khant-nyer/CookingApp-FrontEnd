import { useState } from 'react';
import { api } from '../../../services/api';
import { getItemId } from '../utils/ids';
import { executeDeleteConfirmation } from './backendExplorerFlowHelpers';
import type { DeleteModalState, Ingredient, Recipe, Updater } from '../types';

interface Params {
  run: (action: () => Promise<unknown> | unknown) => Promise<void>;
}

const initialDeleteModalState: DeleteModalState = { open: false, message: '', action: null };

export default function useExplorerDeleteFlow({ run }: Params) {
  const [deleteModal, setDeleteModalState] = useState<DeleteModalState>(initialDeleteModalState);
  const [deleteError, setDeleteError] = useState('');

  function setDeleteModal(value: Updater<DeleteModalState>) {
    setDeleteModalState((prev) => (typeof value === 'function' ? value(prev) : value));
  }

  function requestDelete(message: string, action: () => Promise<unknown> | unknown) {
    setDeleteError('');
    setDeleteModal({ open: true, message, action });
  }

  function handleDeleteFood(food: { id?: string | number; _id?: string | number }) {
    requestDelete('Delete this food?', () => api.deleteFood(getItemId(food)));
  }

  function handleDeleteIngredient(ingredient: Ingredient) {
    requestDelete('Delete this ingredient?', () => api.deleteIngredient(getItemId(ingredient)));
  }

  function handleDeleteRecipe(recipe: Recipe) {
    requestDelete('Delete this recipe?', () => api.deleteRecipe(getItemId(recipe)));
  }

  async function confirmDelete() {
    setDeleteError('');
    try {
      await executeDeleteConfirmation({ deleteModal, run, setDeleteModal });
    } catch (deleteActionError) {
      setDeleteError(deleteActionError instanceof Error ? deleteActionError.message : 'Unable to delete item.');
    }
  }

  return {
    deleteModal,
    deleteError,
    setDeleteModal,
    confirmDelete,
    handleDeleteFood,
    handleDeleteIngredient,
    handleDeleteRecipe
  };
}
