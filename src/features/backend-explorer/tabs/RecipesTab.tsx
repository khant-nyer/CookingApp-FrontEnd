import { memo, useMemo } from 'react';
import type { CreateSuccessState, EntityType, Food, PaginationInfo, Recipe } from '../types';
import { getRecipeTileId } from '../utils/ids';
import { GalleryTile, PaginationControls, TextDetail } from '../shared/ExplorerShared';

interface RecipesTabProps {
  searchQuery?: string;
  recipes: Recipe[];
  foods: Food[];
  selectedId: string;
  setSelectedId: (value: string) => void;
  selectedRecipe?: Recipe;
  createSuccess: CreateSuccessState;
  openCreateModal: (type: EntityType) => void;
  openRecipeUpdateModal: (recipe: Recipe) => void;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading: boolean;
  onDeleteRecipe: (recipe: Recipe) => void;
  allergyAlertText?: string;
}

function RecipesTab({
  searchQuery = '',
  recipes,
  foods,
  selectedId,
  setSelectedId,
  selectedRecipe,
  createSuccess,
  openCreateModal,
  openRecipeUpdateModal,
  pagination,
  onPageChange,
  loading,
  onDeleteRecipe,
  allergyAlertText
}: RecipesTabProps) {
  const filteredRecipes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return recipes;
    return recipes.filter((recipe) => {
      const foodName = (recipe.foodName || '').toLowerCase();
      const version = (recipe.version || '').toLowerCase();
      const description = (recipe.description || '').toLowerCase();
      return foodName.includes(normalizedQuery) || version.includes(normalizedQuery) || description.includes(normalizedQuery);
    });
  }, [recipes, searchQuery]);

  return (
    <div className="grid">
      <div className="card">
        <button onClick={() => openCreateModal('recipe')}>Create Recipe</button>
        {createSuccess.recipe ? <p className="success">{createSuccess.recipe}</p> : null}
        <h3>Gallery</h3>
        <div className="gallery-grid">
          {filteredRecipes.map((recipe) => {
            const sourceIndex = recipes.findIndex((candidate) => candidate === recipe);
            const id = getRecipeTileId(recipe, sourceIndex >= 0 ? sourceIndex : 0);
            const foodName = recipe.foodName || foods.find((food) => String(food.id) === String(recipe.foodId))?.name || 'Food';
            return <GalleryTile key={String(id)} imageUrl={undefined} fallbackText={foodName} subtitle={recipe.version || 'No version'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(String(id))} />;
          })}
        </div>
        {!filteredRecipes.length ? <p className="muted">No recipes found for this search.</p> : null}
        <PaginationControls pagination={pagination} onPageChange={onPageChange} disabled={loading} />
      </div>

      {selectedRecipe ? (
        <TextDetail
          title={`${selectedRecipe.foodName || 'Recipe'} ${selectedRecipe.version ? `(${selectedRecipe.version})` : ''}`}
          alertText={allergyAlertText}
          fields={[{ label: 'Food', value: selectedRecipe.foodName }, { label: 'Version', value: selectedRecipe.version }, { label: 'Description', value: selectedRecipe.description }]}
          sections={[
            { title: 'Ingredients', items: (selectedRecipe.ingredients || []).map((item) => `${item.ingredientName || item.ingredientId}: ${item.quantity} ${item.unit}${item.note ? ` (${item.note})` : ''}`) },
            { title: 'Instructions', items: (selectedRecipe.instructions || []).map((ins, idx) => `Step ${ins.step || ins.stepNumber || idx + 1}: ${ins.description}`) }
          ]}
          onDelete={() => onDeleteRecipe(selectedRecipe)}
          onUpdate={() => openRecipeUpdateModal(selectedRecipe)}
        />
      ) : <div className="card muted">Select a recipe card to view details.</div>}
    </div>
  );
}

export default memo(RecipesTab);
