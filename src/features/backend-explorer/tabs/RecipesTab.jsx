import { getRecipeTileId } from '../utils/ids';
import { GalleryTile, TextDetail } from '../shared/ExplorerShared';

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
}) {
  return (
    <div className="grid">
      <div className="card">
        <button onClick={() => openCreateModal('recipe')}>Create Recipe</button>
        {createSuccess.recipe ? <p className="success">{createSuccess.recipe}</p> : null}
        <h3>Gallery</h3>
        <div className="gallery-grid">
          {recipes.map((recipe, index) => {
            const id = getRecipeTileId(recipe, index);
            const foodName = recipe.foodName || foods.find((food) => food.id === recipe.foodId)?.name || 'Food';
            return <GalleryTile key={id} imageUrl={null} fallbackText={foodName} subtitle={recipe.version || 'No version'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(id)} />;
          })}
        </div>
      </div>

      {selectedRecipe ? (
        <TextDetail
          title={`${selectedRecipe.foodName || 'Recipe'} ${selectedRecipe.version ? `(${selectedRecipe.version})` : ''}`}
          fields={[{ label: 'Food', value: selectedRecipe.foodName }, { label: 'Version', value: selectedRecipe.version }, { label: 'Description', value: selectedRecipe.description }]}
          sections={[
            { title: 'Ingredients', items: (selectedRecipe.ingredients || []).map((i) => `${i.ingredientName || i.ingredientId}: ${i.quantity} ${i.unit}${i.note ? ` (${i.note})` : ''}`) },
            { title: 'Instructions', items: (selectedRecipe.instructions || []).map((ins, idx) => `Step ${ins.step || ins.stepNumber || idx + 1}: ${ins.description}`) }
          ]}
          onDelete={() => onDeleteRecipe(selectedRecipe)}
          onUpdate={() => openRecipeUpdateModal(selectedRecipe)}
        />
      ) : <div className="card muted">Select a recipe card to view details.</div>}
    </div>
  );
}
