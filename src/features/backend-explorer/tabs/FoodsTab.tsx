import { memo, useMemo, useState } from 'react';
import type { CreateSuccessState, Food, PaginationInfo } from '../types';
import { GalleryTile, PaginationControls, TextDetail } from '../shared/ExplorerShared';

interface FoodsTabProps {
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  foods: Food[];
  selectedId: string;
  setSelectedId: (value: string) => void;
  selectedFood?: Food;
  createSuccess: CreateSuccessState;
  openFoodUpdateModal: (food: Food) => void;
  getItemId: (item: Food) => string | number | undefined;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading: boolean;
  onDeleteFood: (food: Food) => void;
  onCreateFood: () => void;
}

function FoodsTab({
  foods,
  selectedId,
  setSelectedId,
  selectedFood,
  createSuccess,
  openFoodUpdateModal,
  getItemId,
  pagination,
  onPageChange,
  loading,
  onDeleteFood,
  onCreateFood,
  searchQuery: controlledSearchQuery,
  onSearchQueryChange
}: FoodsTabProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = controlledSearchQuery ?? localSearchQuery;

  const filteredFoods = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return foods;
    return foods.filter((food) => {
      const name = (food.name || '').toLowerCase();
      const category = (food.category || '').toLowerCase();
      const creator = (food.createdBy || '').toLowerCase();
      return name.includes(normalizedQuery) || category.includes(normalizedQuery) || creator.includes(normalizedQuery);
    });
  }, [foods, searchQuery]);

  return (
    <div className="grid foods-tab-grid">
      <div className="card foods-gallery-card">
        <div className="foods-gallery-header">
          <button type="button" onClick={onCreateFood}>Create Food</button>
        </div>
        {!onSearchQueryChange ? (
          <input
            type="search"
            placeholder="Search foods by name, category, or creator"
            value={searchQuery}
            onChange={(event) => {
              const nextValue = event.target.value;
              setLocalSearchQuery(nextValue);
            }}
          />
        ) : null}
        {createSuccess.food ? <p className="success">{createSuccess.food}</p> : null}
        <h3>Gallery</h3>
        <div className="gallery-grid">
          {filteredFoods.map((food) => {
            const id = getItemId(food);
            return <GalleryTile key={String(id || food.name)} imageUrl={food.imageUrl} fallbackText={food.name || 'Unnamed food'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(String(id || ''))} />;
          })}
        </div>
        {!filteredFoods.length ? <p className="muted">No foods found for this search.</p> : null}
        <PaginationControls pagination={pagination} onPageChange={onPageChange} disabled={loading} />
      </div>

      {selectedFood ? (
        <TextDetail
          title={selectedFood.name || 'Food details'}
          imageUrl={selectedFood.imageUrl}
          fields={[
            { label: 'Category', value: selectedFood.category },
            { label: 'Created by', value: selectedFood.createdBy },
            { label: 'Recipe count', value: selectedFood.recipeCount }
          ]}
          sections={[
            {
              title: 'Recipes',
              items: (selectedFood.recipes || []).map((recipe) => recipe.name || `Recipe #${recipe.id}`)
            }
          ]}
          onDelete={() => onDeleteFood(selectedFood)}
          onUpdate={() => openFoodUpdateModal(selectedFood)}
        />
      ) : <div className="card foods-detail-placeholder muted">Select a food image to view details.</div>}
    </div>
  );
}

export default memo(FoodsTab);
