import { memo, useMemo } from 'react';
import type { Ingredient, TabKey } from '../types';
import { GalleryTile, NutritionIcon } from '../shared/ExplorerShared';
import { filterNutrientCatalog } from '../utils/nutrients';

interface NutritionTabProps {
  searchQuery?: string;
  selectedNutrient: string;
  setSelectedNutrient: (nutrient: string) => void;
  nutrientFilteredIngredients: Ingredient[];
  setActiveTab: (tab: TabKey) => void;
  getItemId: (item: Ingredient) => string | number | undefined;
}

function NutritionTab({
  searchQuery = '',
  selectedNutrient,
  setSelectedNutrient,
  nutrientFilteredIngredients,
  setActiveTab,
  getItemId
}: NutritionTabProps) {
  const filteredNutrients = useMemo(() => filterNutrientCatalog(searchQuery), [searchQuery]);

  const filteredNutrientIngredients = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return nutrientFilteredIngredients;
    return nutrientFilteredIngredients.filter((ingredient) => {
      const name = (ingredient.name || '').toLowerCase();
      const category = (ingredient.category || '').toLowerCase();
      return name.includes(normalizedQuery) || category.includes(normalizedQuery);
    });
  }, [nutrientFilteredIngredients, searchQuery]);

  return (
    <div className="grid">
      <div className="card">
        <h3>Nutrients</h3>
        <p className="muted">Select a nutrient to view ingredients containing it.</p>
        <div className="nutrient-grid">
          {filteredNutrients.map((nutrient) => (
            <NutritionIcon key={nutrient.key} nutrient={nutrient.key} selected={nutrient.key === selectedNutrient} onClick={() => setSelectedNutrient(nutrient.key)} />
          ))}
        </div>
        {!filteredNutrients.length ? <p className="muted">No nutrients found for this search.</p> : null}
      </div>

      <div className="card">
        <h3>Ingredients with {selectedNutrient}</h3>
        {!filteredNutrientIngredients.length ? <p className="muted">No ingredients found with this nutrient/search.</p> : null}
        <div className="gallery-grid">
          {filteredNutrientIngredients.map((ingredient) => {
            const match = ingredient.nutritionList?.find((item) => item.nutrient === selectedNutrient);
            return <GalleryTile key={String(getItemId(ingredient) || ingredient.name)} imageUrl={ingredient.imageUrl} fallbackText={ingredient.name || 'Unnamed ingredient'} subtitle={match ? `${match.value} ${match.unit}` : ''} onClick={() => setActiveTab('ingredients')} />;
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(NutritionTab);
