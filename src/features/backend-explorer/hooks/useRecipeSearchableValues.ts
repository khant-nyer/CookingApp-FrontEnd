import { useCallback, useMemo } from 'react';
import { getItemId } from '../utils/ids';
import { formatNutrientLabel } from '../utils/nutrients';
import type { Ingredient, Recipe } from '../types';


/**
 * Derives a stable `getRecipeSearchableValues` function that expands a recipe
 * into a flat list of searchable strings (food name, description, ingredient
 * names/notes, and all associated nutrient labels).
 *
 * Extracted here so both the dashboard and RecipesTab can share the same
 * derivation without duplicating the `ingredientNutritionById` map.
 */
export function useRecipeSearchableValues(ingredients: Ingredient[]) {
    const ingredientNutritionById = useMemo(() => {
        const map = new Map<string, string[]>();

        ingredients.forEach((ingredient) => {
            const id = String(getItemId(ingredient) || '');
            if (!id) return;

            const nutrients = (ingredient.nutritionList ?? []).flatMap((nutrition) => {
                const raw = String(nutrition?.nutrient || '').trim();
                if (!raw) return [];
                return [raw, formatNutrientLabel(raw)];
            });

            map.set(id, nutrients);
        });

        return map;
    }, [ingredients]);

    const getRecipeSearchableValues = useCallback(
        (recipe: Recipe): Array<string | undefined> => {
            const ingredientValues = (recipe.ingredients ?? []).flatMap((ingredient) => {
                const id = String(ingredient.ingredientId || '');
                const nutritionTerms = ingredientNutritionById.get(id) ?? [];
                return [ingredient.ingredientName, ingredient.note, id, ...nutritionTerms];
            });

            return [recipe.foodName, recipe.description, ...ingredientValues];
        },
        [ingredientNutritionById],
    );

    return { getRecipeSearchableValues };
}