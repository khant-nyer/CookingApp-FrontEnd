import { useEffect, useRef, useState } from 'react';
import useBackendData from './useBackendData';
import type { TabKey } from '../types';

export default function useExplorerViewState() {
  const [activeTab, setActiveTab] = useState<TabKey>('foods');
  const [selectedId, setSelectedId] = useState('');
  const [selectedNutrient, setSelectedNutrient] = useState('CALORIES');
  const hasLoadedInitiallyRef = useRef(false);

  const backendData = useBackendData();
  const { loadAll } = backendData;

  useEffect(() => {
    if (hasLoadedInitiallyRef.current) return;
    hasLoadedInitiallyRef.current = true;
    void loadAll();
  }, [loadAll]);

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
