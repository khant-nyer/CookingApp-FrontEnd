import { memo, useMemo } from 'react';
import { nutrientOptions } from '../constants/nutrients';
import type { Ingredient, TabKey } from '../types';
import { GalleryTile, NutritionIcon } from '../shared/ExplorerShared';
import { filterNutrientCatalogByQuery } from '../utils/nutrients';

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
  const normalizedQuery = searchQuery.trim();
  const queryMatchedNutrients = useMemo(
    () => filterNutrientCatalogByQuery(normalizedQuery).map((item) => item.key),
    [normalizedQuery]
  );

  const visibleNutrients = useMemo(() => {
    if (!normalizedQuery) return nutrientOptions;
    const matched = new Set(queryMatchedNutrients);
    return nutrientOptions.filter((nutrient) => matched.has(nutrient));
  }, [normalizedQuery, queryMatchedNutrients]);

  const shouldFilterByIngredientText = normalizedQuery.length > 0 && !queryMatchedNutrients.length;

  const filteredNutrientIngredients = useMemo(() => {
    const normalizedIngredientQuery = searchQuery.trim().toLowerCase();
    if (!shouldFilterByIngredientText || !normalizedIngredientQuery) return nutrientFilteredIngredients;
    return nutrientFilteredIngredients.filter((ingredient) => {
      const name = (ingredient.name || '').toLowerCase();
      const category = (ingredient.category || '').toLowerCase();
      return name.includes(normalizedIngredientQuery) || category.includes(normalizedIngredientQuery);
    });
  }, [nutrientFilteredIngredients, searchQuery, shouldFilterByIngredientText]);

  return (
    <div className="grid">
      <div className="card">
        <h3>Nutrients</h3>
        <p className="muted">Select a nutrient to view ingredients containing it.</p>
        <div className="nutrient-grid">
          {visibleNutrients.map((nutrient) => (
            <NutritionIcon key={nutrient} nutrient={nutrient} selected={nutrient === selectedNutrient} onClick={() => setSelectedNutrient(nutrient)} />
          ))}
        </div>
        {normalizedQuery && !visibleNutrients.length ? <p className="muted">No nutrients match this search.</p> : null}
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
