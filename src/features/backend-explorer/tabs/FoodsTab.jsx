import { GalleryTile, TextDetail } from '../shared/ExplorerShared';

export default function FoodsTab({
  foods,
  selectedId,
  setSelectedId,
  selectedFood,
  createSuccess,
  openCreateModal,
  getItemId,
  onDeleteFood
}) {
  return (
    <div className="grid">
      <div className="card">
        <button onClick={() => openCreateModal('food')}>Create Food</button>
        {createSuccess.food ? <p className="success">{createSuccess.food}</p> : null}
        <h3>Gallery</h3>
        <div className="gallery-grid">
          {foods.map((food) => {
            const id = getItemId(food);
            return <GalleryTile key={id || food.name} imageUrl={food.imageUrl} fallbackText={food.name || 'Unnamed food'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(id)} />;
          })}
        </div>
      </div>

      {selectedFood ? (
        <TextDetail
          title={selectedFood.name || 'Food details'}
          imageUrl={selectedFood.imageUrl}
          fields={[{ label: 'Category', value: selectedFood.category }, { label: 'ID', value: selectedFood.id }]}
          sections={[{ title: 'Recipes', items: (selectedFood.recipes || []).map((r) => r.name || `Recipe #${r.id}`) }]}
          onDelete={() => onDeleteFood(selectedFood)}
        />
      ) : <div className="card muted">Select a food image to view details.</div>}
    </div>
  );
}
