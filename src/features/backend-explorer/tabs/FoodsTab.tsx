import type { Food, CreateSuccessState, EntityType } from '../types';
import { GalleryTile, TextDetail } from '../shared/ExplorerShared';

interface FoodsTabProps {
  foods: Food[];
  selectedId: string;
  setSelectedId: (value: string) => void;
  selectedFood?: Food;
  createSuccess: CreateSuccessState;
  openCreateModal: (type: EntityType) => void;
  getItemId: (item: Food) => string | number | undefined;
  onDeleteFood: (food: Food) => void;
}

export default function FoodsTab({
  foods,
  selectedId,
  setSelectedId,
  selectedFood,
  createSuccess,
  openCreateModal,
  getItemId,
  onDeleteFood
}: FoodsTabProps) {
  return (
    <div className="grid">
      <div className="card">
        <button onClick={() => openCreateModal('food')}>Create Food</button>
        {createSuccess.food ? <p className="success">{createSuccess.food}</p> : null}
        <h3>Gallery</h3>
        <div className="gallery-grid">
          {foods.map((food) => {
            const id = getItemId(food);
            return <GalleryTile key={String(id || food.name)} imageUrl={food.imageUrl} fallbackText={food.name || 'Unnamed food'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(String(id || ''))} />;
          })}
        </div>
      </div>

      {selectedFood ? (
        <TextDetail
          title={selectedFood.name || 'Food details'}
          imageUrl={selectedFood.imageUrl}
          fields={[{ label: 'Category', value: selectedFood.category }, { label: 'ID', value: selectedFood.id }]}
          sections={[{ title: 'Recipes', items: (selectedFood.recipes || []).map((recipe) => recipe.name || `Recipe #${recipe.id}`) }]}
          onDelete={() => onDeleteFood(selectedFood)}
        />
      ) : <div className="card muted">Select a food image to view details.</div>}
    </div>
  );
}
