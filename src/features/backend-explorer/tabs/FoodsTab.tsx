import { memo } from 'react';
import type { CreateSuccessState, Food, PaginationInfo } from '../types';
import { GalleryTile, PaginationControls, TextDetail } from '../shared/ExplorerShared';

interface FoodsTabProps {
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
  onDeleteFood
}: FoodsTabProps) {
  return (
    <div className="grid foods-tab-grid">
      <div className="card foods-gallery-card">
        {createSuccess.food ? <p className="success">{createSuccess.food}</p> : null}
        <h3>Gallery</h3>
        <div className="gallery-grid">
          {foods.map((food) => {
            const id = getItemId(food);
            return <GalleryTile key={String(id || food.name)} imageUrl={food.imageUrl} fallbackText={food.name || 'Unnamed food'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(String(id || ''))} />;
          })}
        </div>
        <PaginationControls pagination={pagination} onPageChange={onPageChange} disabled={loading} />
      </div>

      {selectedFood ? (
        <TextDetail
          title={selectedFood.name || 'Food details'}
          imageUrl={selectedFood.imageUrl}
          fields={[{ label: 'Category', value: selectedFood.category }]}
          sections={[{ title: 'Recipes', items: (selectedFood.recipes || []).map((recipe) => recipe.name || `Recipe #${recipe.id}`) }]}
          onDelete={() => onDeleteFood(selectedFood)}
          onUpdate={() => openFoodUpdateModal(selectedFood)}
        />
      ) : <div className="card foods-detail-placeholder muted">Select a food image to view details.</div>}
    </div>
  );
}

export default memo(FoodsTab);
