import { nutrientAliasToKey, nutrientCatalog } from '../constants/nutrients';

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

export function filterNutrientCatalog(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return nutrientCatalog;

  return nutrientCatalog.filter((item) => {
    const name = item.key.toLowerCase();
    const noUnderscore = item.key.replace(/_/g, ' ').toLowerCase();
    const short = (item.short || '').toLowerCase();
    const aliases = (item.aliases || []).join(' ').toLowerCase();
    return name.includes(normalizedQuery)
      || noUnderscore.includes(normalizedQuery)
      || short.includes(normalizedQuery)
      || aliases.includes(normalizedQuery);
  });
}
