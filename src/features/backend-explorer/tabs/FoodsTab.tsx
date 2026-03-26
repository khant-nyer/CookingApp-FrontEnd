import { memo, useMemo, useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFoods = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return foods;
    return foods.filter((food) => {
      const name = (food.name || '').toLowerCase();
      const category = (food.category || '').toLowerCase();
      return name.includes(normalizedQuery) || category.includes(normalizedQuery);
    });
  }, [foods, searchQuery]);

  return (
    <section className="foods-tab-shell">
      <header className="foods-tab-header">
        <div>
          <h2>Foods Database</h2>
          <p>Manage your culinary creations and meal elements.</p>
        </div>
        <button type="button" className="foods-add-btn" onClick={() => openCreateModal('food')}>
          + Add Food
        </button>
      </header>

      <div className="foods-tab-divider" />

      <div className="foods-search-row">
        <input
          type="search"
          className="foods-search-input"
          placeholder="Search foods..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div className="foods-feedback-row">
        {createSuccess.food ? <p className="success">{createSuccess.food}</p> : null}
      </div>

      <div className="gallery-grid food-gallery-grid">
        {filteredFoods.map((food) => {
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
                <p className="muted">{recipes.length ? `${recipes.length} recipe${recipes.length === 1 ? '' : 's'} linked.` : 'No recipes linked yet.'}</p>
              </div>
            </article>
          );
        })}
      </div>

      <PaginationControls pagination={pagination} onPageChange={onPageChange} disabled={loading} />
    </section>
  );
}

export default memo(FoodsTab);
