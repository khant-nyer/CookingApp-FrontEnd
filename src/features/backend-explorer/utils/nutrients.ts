import { nutrientAliasToKey } from '../constants/nutrients';

interface NutritionEntryInput {
  nutrient: string;
  value: number | string;
  unit?: string;
}

interface NormalizedNutritionEntry {
  nutrient: string;
  value: number;
  unit: string;
}

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

export function normalizeNutritionEntry(entry: NutritionEntryInput): NormalizedNutritionEntry | null {
  const value = Number(entry.value);
  if (Number.isNaN(value)) return null;

  return {
    nutrient: normalizeNutrientKey(entry.nutrient),
    value,
    unit: entry.unit?.trim() || 'G'
  };
}
