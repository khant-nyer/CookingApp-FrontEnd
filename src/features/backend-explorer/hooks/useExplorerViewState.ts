import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import useBackendData from './useBackendData';

export default function useExplorerViewState() {
  const { token } = useAuth();
  const [selectedId, setSelectedId] = useState('');
  const [selectedNutrient, setSelectedNutrient] = useState('CALORIES');
  const backendData = useBackendData();
  const { loadAll } = backendData;

  useEffect(() => {
    void loadAll();
  }, [loadAll, token]);

  return {
    selectedId,
    setSelectedId,
    selectedNutrient,
    setSelectedNutrient,
    ...backendData
  };
}
