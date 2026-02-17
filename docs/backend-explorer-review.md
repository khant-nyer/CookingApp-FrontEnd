# BackendExplorer (main branch) review

## Why this component is currently too big

`BackendExplorer.jsx` is currently **970 lines** and combines:
- domain constants and nutrient catalog metadata,
- reusable presentational pieces,
- all CRUD orchestration for foods/ingredients/recipes,
- modal workflows for create/update/delete,
- tab-level rendering logic,
- data-fetching and error/loading state.

This makes change risk high because a single edit can affect unrelated areas.

## Key maintainability findings

1. **Too many responsibilities in one component**  
   `BackendExplorer` keeps data fetching, form state, mutation handlers, and rendering for four different views in one place.

2. **High local state complexity**  
   There are many `useState` slices (`foods`, `ingredients`, `recipes`, `foodForm`, `ingredientForm`, `recipeForm`, drafts, modal state, success/error/loading, etc.). The modal/form state shape is deep and updated in many inline lambdas.

3. **Large JSX blocks with repeated patterns**  
   Gallery + details + modal sections are repeated across food, ingredient, and recipe flows. Repetition increases drift and bug likelihood.

4. **Inline transformation logic mixed with UI**  
   Payload shaping (`Number(...)`, trimming, converting list entries) happens in handlers near JSX. This is hard to test in isolation.

5. **Potential identity consistency risks**  
   IDs are sometimes `id`/`_id` and sometimes index-derived (`getRecipeTileId` fallback), which can lead to unstable selection keys when list ordering changes.

6. **Large constant metadata inside UI file**  
   Nutrient catalog, aliases, icon maps, groups, common nutrient lists, and units are all in the same component file.

## Recommended refactor plan

### Phase 1 (low risk, high value)

- **Extract constants/config** to `src/features/backend-explorer/constants/`:
  - `nutrientCatalog`,
  - `unitOptions`,
  - derived maps (`nutrientAliasToKey`, icons, groups, short names).

- **Extract pure helpers** to `src/features/backend-explorer/utils/`:
  - `normalizeNutrientKey`,
  - API payload mappers for create/update ingredient/recipe,
  - ID helpers and formatters.

- **Extract modal components** (`CreateFoodModal`, `CreateIngredientModal`, `CreateRecipeModal`, `UpdateIngredientModal`, `UpdateRecipeModal`, `ConfirmDeleteModal`) and pass explicit props.

### Phase 2 (state simplification)

- Replace many related `useState`s with scoped reducers:
  - `useReducer(createFlowReducer)` for create modal + draft entities,
  - `useReducer(updateFlowReducer)` for update modal form edits,
  - or use one reducer with typed actions if preferred.

- Move async orchestration to custom hooks:
  - `useBackendData()` for load + refresh,
  - `useFoodActions()`, `useIngredientActions()`, `useRecipeActions()` for mutations.

### Phase 3 (structure and testability)

- Split the page into tab containers:
  - `FoodsTab`, `IngredientsTab`, `RecipesTab`, `NutritionTab`.

- Keep `BackendExplorer` as composition shell only:
  - tab selection,
  - top-level error banner,
  - hook wiring.

- Add unit tests for pure transformations and reducer transitions (especially recipe ingredient/instruction editing).

## Suggested target folder layout

```text
src/features/backend-explorer/
  components/
    BackendExplorerPage.jsx
    tabs/
      FoodsTab.jsx
      IngredientsTab.jsx
      RecipesTab.jsx
      NutritionTab.jsx
    modals/
      CreateFoodModal.jsx
      CreateIngredientModal.jsx
      CreateRecipeModal.jsx
      UpdateIngredientModal.jsx
      UpdateRecipeModal.jsx
      ConfirmDeleteModal.jsx
    shared/
      GalleryTile.jsx
      TextDetail.jsx
      NutrientPicker.jsx
      NutritionSummaryCards.jsx
      RecipeIngredientSummaryCards.jsx
  hooks/
    useBackendData.js
    useFoodActions.js
    useIngredientActions.js
    useRecipeActions.js
  reducers/
    createFlowReducer.js
    updateFlowReducer.js
  utils/
    nutrient.js
    ids.js
    payloadMappers.js
  constants/
    nutrients.js
    units.js
```

## Concrete clean-code rules to apply while refactoring

- Limit each component to one UI responsibility.
- Keep handler functions under ~20 lines by extracting helpers.
- Avoid nested inline state updates inside JSX; route through named handlers.
- Keep domain mapping/parsing logic out of component render files.
- Ensure stable IDs from backend for all list keys and selection state.
- Add lightweight JSDoc types (or migrate this feature to TypeScript) for form/payload structures.

## Priority checklist

1. Extract constants/utilities first.
2. Split modals next.
3. Introduce reducers/hooks.
4. Split tabs.
5. Add tests around reducers + payload mapping.

This sequence minimizes risk while steadily reducing file size and cognitive load.
