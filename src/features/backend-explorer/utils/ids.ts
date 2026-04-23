import type { Identifiable, Recipe } from '../types';

const CANDIDATE_ID_KEYS = ['id', '_id', 'foodId', 'ingredientId', 'recipeId'] as const;
const RECIPE_ID_KEYS = ['id', '_id', 'recipeId'] as const;

export function getItemId(item: Identifiable | null | undefined): string | number | undefined {
  if (!item) return undefined;

  for (const key of CANDIDATE_ID_KEYS) {
    const value = item[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return undefined;
}

export function getRecipeTileId(recipe: Recipe, index: number): string | number {
  for (const key of RECIPE_ID_KEYS) {
    const value = recipe?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return `${recipe?.foodId || 'food'}-${recipe?.version || 'version'}-${index}`;
}
