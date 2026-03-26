import { memo } from 'react';
import type { CreateSuccessState, EntityType, Food, PaginationInfo } from '../types';
import { PaginationControls } from '../shared/ExplorerShared';

interface FoodsTabProps {
  foods: Food[];
  createSuccess: CreateSuccessState;
  openCreateModal: (type: EntityType) => void;
  openFoodUpdateModal: (food: Food) => void;
  getItemId: (item: Food) => string | number | undefined;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading: boolean;
  onDeleteFood: (food: Food) => void;
}

function FoodsTab({
  foods,
  createSuccess,
  openCreateModal,
  openFoodUpdateModal,
  getItemId,
  pagination,
  onPageChange,
  loading,
  onDeleteFood
}: FoodsTabProps) {
  return (
    <div className="grid">
      <div className="card">
        <button onClick={() => openCreateModal('food')}>Create Food</button>
        {createSuccess.food ? <p className="success">{createSuccess.food}</p> : null}
        <h3>Gallery</h3>
        <PaginationControls pagination={pagination} onPageChange={onPageChange} disabled={loading} />
        <div className="gallery-grid food-gallery-grid">
          {foods.map((food) => {
            const id = getItemId(food);
            const recipes = food.recipes || [];
            return (
              <article key={String(id || food.name)} className="food-card">
                <div className="food-card-image-wrap">
                  {food.imageUrl ? <img src={food.imageUrl} alt={food.name || 'Unnamed food'} className="food-card-image" /> : <div className="gallery-fallback food-card-image-fallback">{food.name || 'Unnamed food'}</div>}
                  <div className="food-card-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Edit ${food.name || 'food'}`}
                      onClick={() => openFoodUpdateModal(food)}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger-icon-btn"
                      aria-label={`Delete ${food.name || 'food'}`}
                      onClick={() => onDeleteFood(food)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
                <div className="food-card-content">
                  <div className="food-card-title-row">
                    <strong>{food.name || 'Unnamed food'}</strong>
                    <span className="food-category-chip">{food.category || 'Uncategorized'}</span>
                  </div>
                  <p className="muted">Recipes: {recipes.length}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(FoodsTab);
