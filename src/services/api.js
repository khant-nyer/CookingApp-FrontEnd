const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function getHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (networkError) {
    throw new Error(
      `Cannot connect to backend at ${API_BASE_URL}. Check VITE_API_BASE_URL and ensure backend server is running.`
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
      body: JSON.stringify(payload)
    });
  },
  deleteIngredient(id) {
    return request(`/api/ingredients/${id}`, { method: 'DELETE', headers: getHeaders() });
  },
  searchIngredientsByName(name) {
    return request(`/api/ingredients/search?name=${encodeURIComponent(name || '')}`, {
      headers: getHeaders()
    });
  },
  searchIngredientsByNutrition(nutrient, minValue) {
    const params = new URLSearchParams({ nutrient });
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
  createRecipeForFoodViaRecipeApi(foodId, payload) {
    return request(`/api/recipes/foods/${foodId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  }
};
