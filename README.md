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


## Quality gates (Phase 3C/3D)

Before opening a PR, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

CI runs the same commands on each PR and on pushes to protected branches.

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
- `POST /api/recipes/foods/{foodId}` (used by recipe tab create flow)
- `GET /api/recipes`
- `DELETE /api/recipes/{id}`
- `POST /api/recipes` (available in API client, optional)

## Environment

```bash
# For local dev with Vite proxy, keep this unset
# VITE_API_BASE_URL=

# Optional: direct backend call (may require backend CORS config)
# VITE_API_BASE_URL=http://localhost:8080
```

## DTO notes from backend (used to prefill payload editors)

- `FoodDTO` create requires `name`.
- `IngredientDTO` create requires `name`, `servingAmount`, `servingUnit`.
- `RecipeDTO` create requires `version`, non-empty `ingredients`, and non-empty `instructions`.


## Troubleshooting

If you see `ERR_CONNECTION_REFUSED` for `/api/...`, frontend is running but backend is unreachable.

If you see CORS errors from `http://localhost:5173`, use Vite proxy mode (default in this repo) by leaving `VITE_API_BASE_URL` empty.

- Start backend server first (commonly on port `8080` for Spring Boot).
- Set API base URL explicitly:

```bash
npm run dev
# (with VITE_API_BASE_URL unset, /api is proxied to http://localhost:8080)
```


## CORS note

In development, this project uses Vite proxy (`/api` -> `http://localhost:8080`) to avoid browser CORS issues.

If you set `VITE_API_BASE_URL` to an absolute origin (for example `http://localhost:8080`), browser CORS rules apply and backend must allow the frontend origin (such as `http://localhost:5173`).
