import { memo, useMemo, useState } from 'react';
import type { CreateSuccessState, EntityType, Food, PaginationInfo, Recipe } from '../types';
import { getRecipeTileId } from '../utils/ids';
import { PaginationControls } from '../shared/ExplorerShared';

interface RecipesTabProps {
  recipes: Recipe[];
  foods: Food[];
  createSuccess: CreateSuccessState;
  openCreateModal: (type: EntityType) => void;
  openRecipeUpdateModal: (recipe: Recipe) => void;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading: boolean;
  onDeleteRecipe: (recipe: Recipe) => void;
}

function RecipesTab({
  recipes,
  foods,
  createSuccess,
  openCreateModal,
  openRecipeUpdateModal,
  pagination,
  onPageChange,
  loading,
  onDeleteRecipe
}: RecipesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return recipes;
    return recipes.filter((recipe) => {
      const foodName = (recipe.foodName || foods.find((food) => String(food.id) === String(recipe.foodId))?.name || '').toLowerCase();
      const version = (recipe.version || '').toLowerCase();
      const description = (recipe.description || '').toLowerCase();
      return foodName.includes(normalizedQuery) || version.includes(normalizedQuery) || description.includes(normalizedQuery);
    });
  }, [recipes, foods, searchQuery]);

  return (
    <section className="recipes-tab-shell">
      <header className="recipes-tab-header">
        <div>
          <h2>Master Recipes</h2>
          <p>Curate the instructions and combinations for your dishes.</p>
        </div>
        <button type="button" className="recipes-add-btn" onClick={() => openCreateModal('recipe')}>
          + Craft Recipe
        </button>
      </header>

      <div className="recipes-tab-divider" />

      <div className="recipes-search-row">
        <input
          type="search"
          className="recipes-search-input"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div className="recipes-feedback-row">
        {createSuccess.recipe ? <p className="success">{createSuccess.recipe}</p> : null}
        <PaginationControls pagination={pagination} onPageChange={onPageChange} disabled={loading} />
      </div>

      <div className="recipes-card-list">
        {filteredRecipes.map((recipe, index) => {
          const id = getRecipeTileId(recipe, index);
          const linkedFood = foods.find((food) => String(food.id) === String(recipe.foodId));
          const foodName = recipe.foodName || linkedFood?.name || 'Recipe';
          const totalMinutes = Math.max((recipe.instructions || []).length * 5, 20);
          const cookMinutes = Math.max((recipe.instructions || []).length * 4, 15);
          const keyIngredients = (recipe.ingredients || []).slice(0, 3).map((item) => item.ingredientName || String(item.ingredientId));

          return (
            <article key={String(id)} className="recipe-feature-card" onClick={() => setDetailRecipe(recipe)}>
              <div className="recipe-feature-image-wrap">
                <span className="recipe-difficulty-pill">Easy</span>
                {linkedFood?.imageUrl ? <img src={linkedFood.imageUrl} alt={foodName} className="recipe-feature-image" /> : <div className="recipe-feature-image fallback">🍝</div>}
              </div>
              <div className="recipe-feature-content">
                <div className="recipe-feature-title-row">
                  <h3>{foodName}</h3>
                  <div className="recipe-feature-actions">
                    <button type="button" className="icon-btn" aria-label={`Edit ${foodName}`} onClick={(event) => { event.stopPropagation(); openRecipeUpdateModal(recipe); }}>✎</button>
                    <button type="button" className="icon-btn danger-icon-btn" aria-label={`Delete ${foodName}`} onClick={(event) => { event.stopPropagation(); onDeleteRecipe(recipe); }}>🗑</button>
                  </div>
                </div>
                <div className="recipe-meta-row">
                  <span>{totalMinutes}m total</span>
                  <span>{cookMinutes}m cook</span>
                </div>
                <div className="recipe-key-ingredients">
                  <small>Key ingredients</small>
                  <div className="recipe-ingredient-chip-row">
                    {keyIngredients.length ? keyIngredients.map((item) => <span key={`${id}-${item}`} className="recipe-ingredient-chip">{item}</span>) : <span className="muted">No ingredients yet</span>}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {detailRecipe ? (
        <div className="modal-backdrop" onClick={() => setDetailRecipe(null)}>
          <div className="modal-card recipe-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="recipe-detail-head">
              <h3>{detailRecipe.foodName || foods.find((food) => String(food.id) === String(detailRecipe.foodId))?.name || 'Recipe details'}</h3>
            </div>
            <div className="recipe-detail-grid">
              <p><strong>Version:</strong> {detailRecipe.version || '-'}</p>
              <p><strong>Description:</strong> {detailRecipe.description || '-'}</p>
              <p><strong>Total Steps:</strong> {(detailRecipe.instructions || []).length}</p>
              <p><strong>Total Ingredients:</strong> {(detailRecipe.ingredients || []).length}</p>
            </div>
            <div className="recipe-detail-block">
              <strong>Ingredients</strong>
              {!detailRecipe.ingredients?.length ? <p className="muted">No ingredients available.</p> : null}
              {detailRecipe.ingredients?.length ? (
                <div className="recipe-detail-list">
                  {detailRecipe.ingredients.map((item, idx) => (
                    <p key={`${item.ingredientId}-${idx}`}>{item.ingredientName || item.ingredientId}: {item.quantity} {item.unit}{item.note ? ` (${item.note})` : ''}</p>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="recipe-detail-block">
              <strong>Instructions</strong>
              {!detailRecipe.instructions?.length ? <p className="muted">No instructions available.</p> : null}
              {detailRecipe.instructions?.length ? (
                <div className="recipe-detail-list">
                  {detailRecipe.instructions.map((instruction, idx) => (
                    <p key={`instruction-${idx}`}>Step {instruction.step || instruction.stepNumber || idx + 1}: {instruction.description}</p>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="ingredient-detail-actions">
              <button type="button" className="secondary" onClick={() => setDetailRecipe(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default memo(RecipesTab);
