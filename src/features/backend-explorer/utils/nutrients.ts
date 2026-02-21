import { nutrientAliasToKey } from '../constants/nutrients';

export function normalizeNutrientKey(nutrient: string): string {
  if (!nutrient) return 'CALORIES';

  const direct = nutrientAliasToKey[nutrient];
  if (direct) return direct;

  const upper = nutrientAliasToKey[String(nutrient).toUpperCase()];
  if (upper) return upper;

  const lower = nutrientAliasToKey[String(nutrient).toLowerCase()];
  if (lower) return lower;

  return 'CALORIES';
}
