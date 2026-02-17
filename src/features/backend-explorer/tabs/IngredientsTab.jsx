import { GalleryTile, TextDetail } from '../shared/ExplorerShared';

export default function IngredientsTab({
  ingredients,
  selectedId,
  setSelectedId,
  selectedIngredient,
  createSuccess,
  openCreateModal,
  openIngredientUpdateModal,
  getItemId,
  onDeleteIngredient
}) {
  return (
    <div className="grid">
      <div className="card">
        <button onClick={() => openCreateModal('ingredient')}>Create Ingredient</button>
        {createSuccess.ingredient ? <p className="success">{createSuccess.ingredient}</p> : null}
        <h3>Gallery</h3>
        <div className="gallery-grid">
          {ingredients.map((ingredient) => {
            const id = getItemId(ingredient);
            return <GalleryTile key={id || ingredient.name} imageUrl={ingredient.imageUrl} fallbackText={ingredient.name || 'Unnamed ingredient'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(id)} />;
          })}
        </div>
      </div>

      {selectedIngredient ? (
        <TextDetail
          title={selectedIngredient.name || 'Ingredient details'}
          imageUrl={selectedIngredient.imageUrl}
          fields={[
            { label: 'Category', value: selectedIngredient.category },
            { label: 'Description', value: selectedIngredient.description },
            { label: 'Serving', value: `${selectedIngredient.servingAmount || '-'} ${selectedIngredient.servingUnit || ''}` }
          ]}
          sections={[{ title: 'Nutritions', items: (selectedIngredient.nutritionList || []).map((n) => `${n.nutrient}: ${n.value} ${n.unit}`) }]}
          onDelete={() => onDeleteIngredient(selectedIngredient)}
          onUpdate={() => openIngredientUpdateModal(selectedIngredient)}
        />
      ) : <div className="card muted">Select an ingredient image to view details.</div>}
    </div>
  );
}
