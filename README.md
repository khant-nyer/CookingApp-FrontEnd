# CookingApp FrontEnd

React + Vite frontend scaffold for the CookingApp backend API.

## Requirements

- Node.js `20.19.x`

## Run locally

```bash
nvm use
npm install
npm run dev
```

The app expects backend endpoints with these routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/recipes`
- `POST /api/recipes`

Override backend URL with:

```bash
VITE_API_BASE_URL=http://localhost:3000
```
