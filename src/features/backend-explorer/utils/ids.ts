import type { Identifiable, Recipe } from '../types';

export function getItemId(item: Identifiable | null | undefined): string | number | undefined {
  return item?.id || item?._id;
}

export function getRecipeTileId(recipe: Recipe, index: number): string | number {
  return getItemId(recipe) || `${recipe?.foodId || 'food'}-${recipe?.version || 'version'}-${index}`;
}
