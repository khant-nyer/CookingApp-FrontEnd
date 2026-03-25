# CookingApp FrontEnd

React + Vite frontend for the CookingApp backend controllers with Cognito login/logout and forgot password handled in frontend.

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
On pushes to `main`, GitHub Actions also triggers Render deployment via a deploy hook and then smoke-checks `https://cookingapp-6pj2.onrender.com/health`. The smoke check treats `2xx/3xx` responses and auth-gated `401/403` responses as reachable. Configure repository secret `RENDER_DEPLOY_HOOK_URL` with your Render deploy hook URL.

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


## Auth flow

1. Register with email + password.
2. Verify email using Cognito confirmation code.
3. Login to receive Cognito ID/access tokens (and refresh token for same-browser session extension).
4. When token expiry approaches, the app shows a session warning modal with countdown.
5. Choose **Extend session** to refresh tokens, or **Log out now** to end the session immediately.

### Session warning + extension behavior

- Warning opens at `exp - 5 minutes` based on the access token expiry claim.
- Countdown shows remaining time in `X:YY`.
- `Extend session` calls Cognito `REFRESH_TOKEN_AUTH` to mint fresh access/id tokens.
- If extension fails with unrecoverable auth errors (for example invalid/revoked refresh token), the app clears auth state and requires sign-in again.

## Environment

This repo keeps a single committed `.env` file as the default template.

- Configure local machine-specific values in `.env.local`.
- Configure production values on your hosting/deployment platform.

```bash
# API config
VITE_API_BASE_URL=
VITE_PROD_API_BASE_URL=
VITE_DEV_PROXY_TARGET=http://localhost:8080
VITE_DEV_SERVER_PORT=5173

# Cognito auth config
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_xxxxxxxx
VITE_COGNITO_REGION=ap-southeast-2
VITE_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_BACKEND_TOKEN_USE=access
```

## DTO notes from backend (used to prefill payload editors)

- `FoodDTO` create requires `name`.
- `IngredientDTO` create requires `name`, `servingAmount`, `servingUnit`.
- `RecipeDTO` create requires `version`, non-empty `ingredients`, and non-empty `instructions`.



## Cognito auth troubleshooting matrix

| Cognito code / condition | User-facing message | Typical user action |
| --- | --- | --- |
| `UserNotConfirmedException` | Your account is not verified yet. Please verify your email first. | Verify email, then login again. |
| `CodeMismatchException` | The verification code is invalid. Please check the code and try again. | Re-enter latest code. |
| `ExpiredCodeException` | The verification code has expired. Please request a new code. | Request a new code and retry. |
| `TooManyFailedAttemptsException` / `TooManyRequestsException` | Too many attempts/requests right now. Please wait and try again. | Wait briefly, then retry. |
| `InvalidPasswordException` | Your password does not meet policy requirements. Please use a stronger password. | Use stronger password per policy. |
| Network failure / timeout | Network issue detected. Check your connection and try again. | Check connectivity and retry. |
| Unrecoverable extend-session failure (`NotAuthorizedException`, etc.) | Your session can no longer be extended. Please sign in again. | Login again to start a new session. |

## Troubleshooting

If you see `ERR_CONNECTION_REFUSED` for `/api/...`, frontend is running but backend is unreachable.

If you see CORS errors from `http://localhost:5173`, use Vite proxy mode (default in this repo) by leaving `VITE_API_BASE_URL` empty.

If backend expects Cognito access tokens, ensure `VITE_COGNITO_BACKEND_TOKEN_USE=access`, then logout/login again to refresh stored tokens.

If backend returns `invalid_token` with `Token client does not match configured app client`, verify `VITE_COGNITO_USER_POOL_CLIENT_ID` matches backend config exactly, then logout/login (or clear local storage) to mint a fresh token.

- Start backend server first (commonly on port `8080` for Spring Boot).
- Set API base URL explicitly:

```bash
npm run dev
# (with VITE_API_BASE_URL unset, /api is proxied to http://localhost:8080)
```


## CORS note

In development, this project uses Vite proxy (`/api` -> `http://localhost:8080`) to avoid browser CORS issues.

If you set `VITE_API_BASE_URL` to an absolute origin (for example `http://localhost:8080`), browser CORS rules apply and backend must allow the frontend origin (such as `http://localhost:5173`).
