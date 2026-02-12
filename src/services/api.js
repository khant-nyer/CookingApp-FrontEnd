const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function getHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getRecipes() {
    return request('/api/recipes', {
      headers: getHeaders()
    });
  },
  createRecipe(payload) {
    return request('/api/recipes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  }
};
