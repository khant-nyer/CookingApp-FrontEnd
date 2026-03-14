import { useEffect, useState } from 'react';
import useBackendData from './useBackendData';
import type { TabKey } from '../types';

export default function useExplorerViewState() {
  const [activeTab, setActiveTab] = useState<TabKey>('foods');
  const [selectedId, setSelectedId] = useState('');
  const [selectedNutrient, setSelectedNutrient] = useState('CALORIES');
  const backendData = useBackendData();
  const { loadTabData } = backendData;

  useEffect(() => {
    void loadTabData(activeTab);
  }, [activeTab, loadTabData]);

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
