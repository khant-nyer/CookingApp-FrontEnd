import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { api } from '../../../services/api';
import type { EntityType, FoodForm } from '../types';
import { buildCreateFoodPayload } from '../utils/payloadMappers';

interface UseFoodActionsParams {
  foodForm: FoodForm;
  setFoodForm: Dispatch<SetStateAction<FoodForm>>;
  setCreateError: (message: string) => void;
  setCreateSuccessByType: (type: EntityType, message: string) => void;
  closeCreateModal: () => void;
  setLoading: Dispatch<SetStateAction<boolean>>;
  refreshFoods: () => Promise<void>;
}

export default function useFoodActions({
  foodForm,
  setFoodForm,
  setCreateError,
  setCreateSuccessByType,
  closeCreateModal,
  setLoading,
  refreshFoods
}: UseFoodActionsParams) {
  const createFood = useCallback(async () => {
    if (!foodForm.name.trim()) return setCreateError('Food name is required.');

    setLoading(true);
    setCreateError('');
    try {
      await api.createFood(buildCreateFoodPayload(foodForm));
      await refreshFoods();
      setFoodForm({ name: '', category: '', imageUrl: '' });
      setCreateSuccessByType('food', 'Food created successfully.');
      closeCreateModal();
    } catch (createFoodError) {
      setCreateError(createFoodError instanceof Error ? createFoodError.message : 'Unable to create food.');
    } finally {
      setLoading(false);
    }
  }, [foodForm, setCreateError, setLoading, refreshFoods, setFoodForm, setCreateSuccessByType, closeCreateModal]);

  return { createFood };
}
