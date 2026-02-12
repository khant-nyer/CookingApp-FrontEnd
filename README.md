# CookingApp FrontEnd

React + Vite frontend for the CookingApp backend controllers you shared.

## Requirements

- Node.js `20.19.x`

## Run locally

```bash
nvm use
npm install
npm run dev
```

## Backend routes currently wired in UI (no auth)

### Foods
- `GET /api/foods`
- `POST /api/foods`
- `DELETE /api/foods/{id}`
- `GET /api/foods/{id}/recipe-status`
- `POST /api/foods/{id}/recipes`

### Ingredients
- `GET /api/ingredients`
- `POST /api/ingredients`
- `DELETE /api/ingredients/{id}`
- `GET /api/ingredients/search?name=...`
- `GET /api/ingredients/search/by-nutrition?nutrient=...&minValue=...`
- `GET /api/ingredients/discover-supermarkets?ingredientName=...&city=...&userId=...`

### Recipes
- `GET /api/recipes`
- `POST /api/recipes`
- `DELETE /api/recipes/{id}`
- `POST /api/recipes/foods/{foodId}`

## Environment

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## DTO notes from backend (used to prefill payload editors)

- `FoodDTO` create requires `name`.
- `IngredientDTO` create requires `name`, `servingAmount`, `servingUnit`.
- `RecipeDTO` create requires `version`, non-empty `ingredients`, and non-empty `instructions`.
