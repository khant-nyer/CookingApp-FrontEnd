const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const NUTRIENT_ALIASES = {
  SUGAR: 'SUGARS',
  SUGARS: 'SUGARS',
  'TOTAL SUGARS': 'SUGARS',
  'ADDED SUGAR': 'ADDED_SUGARS',
  'ADDED SUGARS': 'ADDED_SUGARS'
};

function normalizeNutrient(nutrient) {
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

function normalizeIngredientPayload(payload = {}) {
  if (!Array.isArray(payload?.nutritionList)) return payload;
  return {
    ...payload,
    nutritionList: payload.nutritionList.map((item) => ({
      ...item,
      nutrient: normalizeNutrient(item?.nutrient)
    }))
  };
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

async function request(path, options = {}) {
  const url = buildUrl(path);

  let response;
  try {
    response = await fetch(url, options);
  } catch (networkError) {
    throw new Error(
      `Cannot connect to backend via ${url}. If running frontend on Vite dev server, keep VITE_API_BASE_URL empty to use proxy, or set it to your backend origin.`
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  // Foods
  getFoods() {
    return request('/api/foods', { headers: getHeaders() });
  },
  createFood(payload) {
    return request('/api/foods', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },
  deleteFood(id) {
    return request(`/api/foods/${id}`, { method: 'DELETE', headers: getHeaders() });
  },
  getFoodRecipeStatus(id) {
    return request(`/api/foods/${id}/recipe-status`, { headers: getHeaders() });
  },
  createRecipeForFood(foodId, payload) {
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
  createIngredient(payload) {
    return request('/api/ingredients', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(normalizeIngredientPayload(payload))
    });
  },
  deleteIngredient(id) {
    return request(`/api/ingredients/${id}`, { method: 'DELETE', headers: getHeaders() });
  },
  updateIngredient(id, payload) {
    return request(`/api/ingredients/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(normalizeIngredientPayload(payload))
    });
  },
  searchIngredientsByName(name) {
    return request(`/api/ingredients/search?name=${encodeURIComponent(name || '')}`, {
      headers: getHeaders()
    });
  },
  searchIngredientsByNutrition(nutrient, minValue) {
    const params = new URLSearchParams({ nutrient: normalizeNutrient(nutrient) });
    if (minValue !== '' && minValue != null) params.set('minValue', String(minValue));
    return request(`/api/ingredients/search/by-nutrition?${params.toString()}`, { headers: getHeaders() });
  },
  discoverSupermarkets(ingredientName, city, userId) {
    const params = new URLSearchParams({ ingredientName });
    if (city) params.set('city', city);
    if (userId) params.set('userId', String(userId));
    return request(`/api/ingredients/discover-supermarkets?${params.toString()}`, { headers: getHeaders() });
  },

  // Recipes
  getRecipes() {
    return request('/api/recipes', { headers: getHeaders() });
  },
  createRecipe(payload) {
    return request('/api/recipes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },
  deleteRecipe(id) {
    return request(`/api/recipes/${id}`, { method: 'DELETE', headers: getHeaders() });
  },
  updateRecipe(id, payload) {
    return request(`/api/recipes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },
  createRecipeForFoodViaRecipeApi(foodId, payload) {
    return request(`/api/recipes/foods/${foodId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  }
};
