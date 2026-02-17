import { useCallback } from 'react';
import { api } from '../../../services/api';
import { buildCreateFoodPayload } from '../utils/payloadMappers';

export default function useFoodActions({
  foodForm,
  setFoodForm,
  setCreateError,
  setCreateSuccessByType,
  closeCreateModal,
  setLoading,
  loadAll
}) {
  const createFood = useCallback(async () => {
    if (!foodForm.name.trim()) return setCreateError('Food name is required.');

    setLoading(true);
    setCreateError('');
    try {
      await api.createFood(buildCreateFoodPayload(foodForm));
      await loadAll();
      setFoodForm({ name: '', category: '', imageUrl: '' });
      setCreateSuccessByType('food', 'Food created successfully.');
      closeCreateModal();
    } catch (createFoodError) {
      setCreateError(createFoodError.message);
    } finally {
      setLoading(false);
    }
  }, [foodForm, setCreateError, setLoading, loadAll, setFoodForm, setCreateSuccessByType, closeCreateModal]);

  return { createFood };
}
