import { describe, expect, it } from 'vitest';
import { getItemId, getRecipeTileId } from './ids';
import { normalizeNutrientKey } from './nutrients';

describe('core utility behavior', () => {
  it('normalizes nutrient aliases and unknown values', () => {
    expect(normalizeNutrientKey('SUGAR')).toBe('SUGARS');
    expect(normalizeNutrientKey('added sugars')).toBe('ADDED_SUGARS');
    expect(normalizeNutrientKey('not-a-known-key')).toBe('CALORIES');
  });

  it('reads entity id from id/_id', () => {
    expect(getItemId({ id: 10 })).toBe(10);
    expect(getItemId({ _id: 'abc' })).toBe('abc');
    expect(getItemId(null)).toBeUndefined();
  });

  it('creates stable recipe tile fallback id when backend id is missing', () => {
    const first = getRecipeTileId({ foodId: 3, version: 'v1' }, 0);
    const second = getRecipeTileId({ foodId: 3, version: 'v1' }, 1);

    expect(first).toBe('3-v1-0');
    expect(second).toBe('3-v1-1');
  });
});
