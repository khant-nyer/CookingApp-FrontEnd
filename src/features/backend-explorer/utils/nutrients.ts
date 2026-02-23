import { nutrientAliasToKey } from '../constants/nutrients';

interface NormalizeNutrientOptions {
  fallback?: string;
  allowUnknown?: boolean;
}

export function normalizeNutrientKey(
  nutrient: string | null | undefined,
  { fallback = 'CALORIES', allowUnknown = false }: NormalizeNutrientOptions = {}
): string {
  if (nutrient == null) return fallback;

  const raw = String(nutrient).trim();
  if (!raw) return fallback;

  const normalizedToken = raw.replace(/[_\s]+/g, ' ').toUpperCase();
  const candidates = [raw, raw.toUpperCase(), raw.toLowerCase(), normalizedToken, normalizedToken.toLowerCase()];

  for (const candidate of candidates) {
    const resolved = nutrientAliasToKey[candidate];
    if (resolved) return resolved;
  }

  if (allowUnknown) {
    return raw.toUpperCase().replace(/\s+/g, '_');
  }

  return fallback;
}
