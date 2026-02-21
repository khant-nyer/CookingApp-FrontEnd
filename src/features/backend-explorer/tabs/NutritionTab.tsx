import { nutrientOptions } from '../constants/nutrients';
import type { Ingredient, TabKey } from '../types';
import { GalleryTile, NutritionIcon } from '../shared/ExplorerShared';

interface NutritionTabProps {
  selectedNutrient: string;
  setSelectedNutrient: (nutrient: string) => void;
  nutrientFilteredIngredients: Ingredient[];
  setActiveTab: (tab: TabKey) => void;
  getItemId: (item: Ingredient) => string | number | undefined;
}

export default function NutritionTab({
  selectedNutrient,
  setSelectedNutrient,
  nutrientFilteredIngredients,
  setActiveTab,
  getItemId
}: NutritionTabProps) {
  return (
    <div className="grid">
      <div className="card">
        <h3>Nutrients</h3>
        <p className="muted">Select a nutrient to view ingredients containing it.</p>
        <div className="nutrient-grid">
          {nutrientOptions.map((nutrient) => (
            <NutritionIcon key={nutrient} nutrient={nutrient} selected={nutrient === selectedNutrient} onClick={() => setSelectedNutrient(nutrient)} />
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Ingredients with {selectedNutrient}</h3>
        {!nutrientFilteredIngredients.length ? <p className="muted">No ingredients found with this nutrient.</p> : null}
        <div className="gallery-grid">
          {nutrientFilteredIngredients.map((ingredient) => {
            const match = ingredient.nutritionList?.find((item) => item.nutrient === selectedNutrient);
            return <GalleryTile key={String(getItemId(ingredient) || ingredient.name)} imageUrl={ingredient.imageUrl} fallbackText={ingredient.name || 'Unnamed ingredient'} subtitle={match ? `${match.value} ${match.unit}` : ''} onClick={() => setActiveTab('ingredients')} />;
          })}
        </div>
      </div>
    </div>
  );
}
