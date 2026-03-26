import { memo, useMemo, useState } from 'react';
import type { CreateSuccessState, EntityType, Ingredient, PaginationInfo } from '../types';
import { PaginationControls } from '../shared/ExplorerShared';

interface IngredientsTabProps {
  ingredients: Ingredient[];
  createSuccess: CreateSuccessState;
  openCreateModal: (type: EntityType) => void;
  openIngredientUpdateModal: (ingredient: Ingredient) => void;
  getItemId: (item: Ingredient) => string | number | undefined;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading: boolean;
  onDeleteIngredient: (ingredient: Ingredient) => void;
}

function IngredientsTab({
  ingredients,
  createSuccess,
  openCreateModal,
  openIngredientUpdateModal,
  getItemId,
  pagination,
  onPageChange,
  loading,
  onDeleteIngredient
}: IngredientsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIngredients = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return ingredients;
    return ingredients.filter((ingredient) => {
      const name = (ingredient.name || '').toLowerCase();
      const category = (ingredient.category || '').toLowerCase();
      const unit = (ingredient.servingUnit || '').toLowerCase();
      return name.includes(normalizedQuery) || category.includes(normalizedQuery) || unit.includes(normalizedQuery);
    });
  }, [ingredients, searchQuery]);

  return (
    <section className="ingredients-tab-shell">
      <header className="ingredients-tab-header">
        <div>
          <h2>Pantry Inventory</h2>
          <p>Manage your raw ingredients and supplies.</p>
        </div>
        <button type="button" className="ingredients-add-btn" onClick={() => openCreateModal('ingredient')}>
          + Add Ingredient
        </button>
      </header>

      <div className="ingredients-tab-divider" />

      <div className="ingredients-search-row">
        <input
          type="search"
          className="ingredients-search-input"
          placeholder="Search pantry..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div className="ingredients-feedback-row">
        {createSuccess.ingredient ? <p className="success">{createSuccess.ingredient}</p> : null}
        <PaginationControls pagination={pagination} onPageChange={onPageChange} disabled={loading} />
      </div>

      <div className="ingredients-table-wrap">
        <table className="ingredients-table">
          <thead>
            <tr>
              <th>Ingredient Name</th>
              <th>Category</th>
              <th>Measurement</th>
              <th className="ingredients-actions-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.map((ingredient) => {
              const id = getItemId(ingredient);
              return (
                <tr key={String(id || ingredient.name)}>
                  <td>
                    <div className="ingredient-name-cell">
                      <span className="ingredient-row-icon">🌿</span>
                      <strong>{ingredient.name || 'Unnamed ingredient'}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="ingredient-category-chip">{ingredient.category || 'Other'}</span>
                  </td>
                  <td>
                    <span className="muted">measured in </span>
                    <strong>{ingredient.servingUnit || '-'}</strong>
                  </td>
                  <td>
                    <div className="ingredient-actions-cell">
                      <button type="button" className="ingredient-action-btn edit" aria-label={`Edit ${ingredient.name || 'ingredient'}`} onClick={() => openIngredientUpdateModal(ingredient)}>✎</button>
                      <button type="button" className="ingredient-action-btn delete" aria-label={`Delete ${ingredient.name || 'ingredient'}`} onClick={() => onDeleteIngredient(ingredient)}>🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(IngredientsTab);
