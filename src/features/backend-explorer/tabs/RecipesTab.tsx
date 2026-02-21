import type { CreateSuccessState, EntityType, Food, Recipe } from '../types';
import { getRecipeTileId } from '../utils/ids';
import { GalleryTile, TextDetail } from '../shared/ExplorerShared';

interface RecipesTabProps {
  recipes: Recipe[];
  foods: Food[];
  selectedId: string;
  setSelectedId: (value: string) => void;
  selectedRecipe?: Recipe;
  createSuccess: CreateSuccessState;
  openCreateModal: (type: EntityType) => void;
  openRecipeUpdateModal: (recipe: Recipe) => void;
  onDeleteRecipe: (recipe: Recipe) => void;
}

export default function RecipesTab({
  recipes,
  foods,
  selectedId,
  setSelectedId,
  selectedRecipe,
  createSuccess,
  openCreateModal,
  openRecipeUpdateModal,
  onDeleteRecipe
}: RecipesTabProps) {
  return (
    <div className="grid">
      <div className="card">
        <button onClick={() => openCreateModal('recipe')}>Create Recipe</button>
        {createSuccess.recipe ? <p className="success">{createSuccess.recipe}</p> : null}
        <h3>Gallery</h3>
        <div className="gallery-grid">
          {recipes.map((recipe, index) => {
            const id = getRecipeTileId(recipe, index);
            const foodName = recipe.foodName || foods.find((food) => String(food.id) === String(recipe.foodId))?.name || 'Food';
            return <GalleryTile key={String(id)} imageUrl={undefined} fallbackText={foodName} subtitle={recipe.version || 'No version'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(String(id))} />;
          })}
        </div>
      </div>

      {selectedRecipe ? (
        <TextDetail
          title={`${selectedRecipe.foodName || 'Recipe'} ${selectedRecipe.version ? `(${selectedRecipe.version})` : ''}`}
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
