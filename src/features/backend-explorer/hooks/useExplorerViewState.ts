import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import useBackendData from './useBackendData';
import type { TabKey } from '../types';

export default function useExplorerViewState() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('foods');
  const [selectedId, setSelectedId] = useState('');
  const [selectedNutrient, setSelectedNutrient] = useState('CALORIES');
  const backendData = useBackendData();
  const { loadAll } = backendData;

  useEffect(() => {
    if (!token) return;
    void loadAll();
  }, [loadAll, token]);

  useEffect(() => {
    setSelectedId('');
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab,
    selectedId,
    setSelectedId,
    selectedNutrient,
    setSelectedNutrient,
    ...backendData
  };
}
