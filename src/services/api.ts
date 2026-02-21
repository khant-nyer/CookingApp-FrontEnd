const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const NUTRIENT_ALIASES: Record<string, string> = {
  SUGAR: 'SUGARS',
  SUGARS: 'SUGARS',
  'TOTAL SUGARS': 'SUGARS',
  'ADDED SUGAR': 'ADDED_SUGARS',
  'ADDED SUGARS': 'ADDED_SUGARS'
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type ApiPayload = Record<string, JsonValue>;

function normalizeNutrient(nutrient: string | null | undefined) {
  if (nutrient == null) return nutrient;
  const raw = String(nutrient).trim();
  if (!raw) return raw;
  const byRaw = NUTRIENT_ALIASES[raw];
  if (byRaw) return byRaw;
  const normalizedToken = raw.replace(/[_\s]+/g, ' ').toUpperCase();
  const byToken = NUTRIENT_ALIASES[normalizedToken];
  if (byToken) return byToken;
  return raw.toUpperCase().replace(/\s+/g, '_');
}

function normalizeIngredientPayload(payload: ApiPayload = {}) {
  if (!Array.isArray(payload?.nutritionList)) return payload;
  return {
    ...payload,
    nutritionList: payload.nutritionList.map((item) => ({
      ...(item as ApiPayload),
      nutrient: normalizeNutrient((item as ApiPayload)?.nutrient as string)
    }))
  };
}

function buildUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json'
  };
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const url = buildUrl(path);

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(
      `Cannot connect to backend via ${url}. If running frontend on Vite dev server, keep VITE_API_BASE_URL empty to use proxy, or set it to your backend origin.`
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error((errorBody as { message?: string }).message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

export const api = {
  // Foods
  getFoods() {
    return request('/api/foods', { headers: getHeaders() });
  },
  createFood(payload: ApiPayload) {
    return request('/api/foods', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },
  deleteFood(id: string | number | undefined) {
    return request(`/api/foods/${id}`, { method: 'DELETE', headers: getHeaders() });
  },
  getFoodRecipeStatus(id: string | number | undefined) {
    return request(`/api/foods/${id}/recipe-status`, { headers: getHeaders() });
  },
  createRecipeForFood(foodId: string | number, payload: ApiPayload) {
    return request(`/api/foods/${foodId}/recipes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },

  // Ingredients
  getIngredients() {
    return request('/api/ingredients', { headers: getHeaders() });
  },
  createIngredient(payload: ApiPayload) {
    return request('/api/ingredients', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(normalizeIngredientPayload(payload))
    });
  },
  deleteIngredient(id: string | number | undefined) {
    return request(`/api/ingredients/${id}`, { method: 'DELETE', headers: getHeaders() });
  },
  updateIngredient(id: string | number | null, payload: ApiPayload) {
    return request(`/api/ingredients/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(normalizeIngredientPayload(payload))
    });
  },
  searchIngredientsByName(name: string) {
    return request(`/api/ingredients/search?name=${encodeURIComponent(name || '')}`, {
      headers: getHeaders()
    });
  },
  searchIngredientsByNutrition(nutrient: string, minValue?: string | number | null) {
    const params = new URLSearchParams({ nutrient: normalizeNutrient(nutrient) || '' });
    if (minValue !== '' && minValue != null) params.set('minValue', String(minValue));
    return request(`/api/ingredients/search/by-nutrition?${params.toString()}`, { headers: getHeaders() });
  },
  discoverSupermarkets(ingredientName: string, city?: string, userId?: string | number) {
    const params = new URLSearchParams({ ingredientName });
    if (city) params.set('city', city);
    if (userId) params.set('userId', String(userId));
    return request(`/api/ingredients/discover-supermarkets?${params.toString()}`, { headers: getHeaders() });
  },

  // Recipes
  getRecipes() {
    return request('/api/recipes', { headers: getHeaders() });
  },
  createRecipe(payload: ApiPayload) {
    return request('/api/recipes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },
  deleteRecipe(id: string | number | undefined) {
    return request(`/api/recipes/${id}`, { method: 'DELETE', headers: getHeaders() });
  },
  updateRecipe(id: string | number | null, payload: ApiPayload) {
    return request(`/api/recipes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },
  createRecipeForFoodViaRecipeApi(foodId: string | number, payload: ApiPayload) {
    return request(`/api/recipes/foods/${foodId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },

  // Auth (optional backend support)
  login(payload: { email: string; password: string }) {
    return request<{ token?: string; accessToken?: string; user?: { email?: string; name?: string } }>('/api/auth/login', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },
  register(payload: { name: string; email: string; password: string }) {
    return request('/api/auth/register', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  }
};
