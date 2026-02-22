import { describe, expect, it } from 'vitest';
import {
  buildCreateIngredientPayload,
  buildCreateRecipePayload,
  buildUpdateRecipePayload
} from './payloadMappers';

describe('payloadMappers', () => {
  it('normalizes and converts ingredient payload fields', () => {
    const payload = buildCreateIngredientPayload(
      {
        name: ' Tomato ',
        category: ' Vegetable ',
        description: ' fresh ',
        servingAmount: '100',
        servingUnit: 'G',
        imageUrl: ' '
      },
      [{ nutrient: 'sugar', value: '12', unit: 'G' }]
    );

    expect(payload).toEqual({
      name: 'Tomato',
      category: 'Vegetable',
      description: 'fresh',
      servingAmount: 100,
      servingUnit: 'G',
      imageUrl: null,
      nutritionList: [{ nutrient: 'SUGARS', value: 12, unit: 'G' }]
    });
  });

  it('builds create recipe payload with fallback step numbers and nullable tutorial url', () => {
    const payload = buildCreateRecipePayload(
      {
        foodId: '9',
        version: ' v2 ',
        description: ' test '
      },
      [{ ingredientId: '7', quantity: '3', unit: 'G', note: '' }],
      [{ description: ' step 1 ', tutorialVideoUrl: ' ' }]
    );

    expect(payload.foodId).toBe(9);
    expect(payload.version).toBe('v2');
    expect(payload.description).toBe('test');
    expect(payload.ingredients[0]).toEqual({ ingredientId: 7, quantity: 3, unit: 'G', note: '' });
    expect(payload.instructions[0]).toEqual({ step: 1, description: 'step 1', tutorialVideoUrl: null });
  });

  it('builds update recipe payload with deterministic step sequence', () => {
    const payload = buildUpdateRecipePayload({
      foodId: '12',
      version: ' v3 ',
      description: ' demo ',
      ingredients: [{ ingredientId: '2', quantity: '50', unit: 'ML', note: 'warm' }],
      instructions: [
        { description: ' first ', tutorialVideoUrl: '' },
        { description: ' second ', tutorialVideoUrl: 'http://video' }
      ]
    });

    expect(payload.instructions.map((item) => item.step)).toEqual([1, 2]);
    expect(payload.instructions[0].tutorialVideoUrl).toBeNull();
    expect(payload.instructions[1].tutorialVideoUrl).toBe('http://video');
  });
});
