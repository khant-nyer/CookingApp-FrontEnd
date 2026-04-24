import { memo, useMemo } from 'react';
import type { CreateSuccessState, EntityType, Ingredient, PaginationInfo } from '../types';
import { GalleryTile, PaginationControls, TextDetail } from '../shared/ExplorerShared';

interface IngredientsTabProps {
  searchQuery?: string;
  ingredients: Ingredient[];
  selectedId: string;
  setSelectedId: (value: string) => void;
  selectedIngredient?: Ingredient;
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
  searchQuery = '',
  ingredients,
  selectedId,
  setSelectedId,
  selectedIngredient,
  createSuccess,
  openCreateModal,
  openIngredientUpdateModal,
  getItemId,
  pagination,
  onPageChange,
  loading,
  onDeleteIngredient
}: IngredientsTabProps) {
  const filteredIngredients = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return ingredients;
    return ingredients.filter((ingredient) => {
      const name = (ingredient.name || '').toLowerCase();
      const category = (ingredient.category || '').toLowerCase();
      const description = (ingredient.description || '').toLowerCase();
      return name.includes(normalizedQuery) || category.includes(normalizedQuery) || description.includes(normalizedQuery);
    });
  }, [ingredients, searchQuery]);

  return (
    <div className="grid">
      <div className="card">
        <button onClick={() => openCreateModal('ingredient')}>Create Ingredient</button>
        {createSuccess.ingredient ? <p className="success">{createSuccess.ingredient}</p> : null}
        <h3>Gallery</h3>
        <div className="gallery-grid">
          {filteredIngredients.map((ingredient) => {
            const id = getItemId(ingredient);
            return <GalleryTile key={String(id || ingredient.name)} imageUrl={ingredient.imageUrl} fallbackText={ingredient.name || 'Unnamed ingredient'} isSelected={String(id) === String(selectedId)} onClick={() => setSelectedId(String(id || ''))} />;
          })}
        </div>
        {!filteredIngredients.length ? <p className="muted">No ingredients found for this search.</p> : null}
        <PaginationControls pagination={pagination} onPageChange={onPageChange} disabled={loading} />
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

export default memo(IngredientsTab);
