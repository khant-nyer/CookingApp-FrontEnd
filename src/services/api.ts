import type { FoodDto, IngredientDto, RecipeDto } from './apiTypes';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_GET_RETRIES = 1;
const TOKEN_STORAGE_KEY = 'cooking_app_token';

const NUTRIENT_ALIASES: Record<string, string> = {
  SUGAR: 'SUGARS',
  SUGARS: 'SUGARS',
  'TOTAL SUGARS': 'SUGARS',
  'ADDED SUGAR': 'ADDED_SUGARS',
  'ADDED SUGARS': 'ADDED_SUGARS'
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type ApiPayload = Record<string, JsonValue>;

type TokenProvider = () => string | null;

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export interface ApiErrorOptions {
  status?: number | null;
  code?: string;
  details?: unknown;
  retryable?: boolean;
  isTimeout?: boolean;
  isNetworkError?: boolean;
}

export class ApiError extends Error {
  status: number | null;
  code: string;
  details: unknown;
  retryable: boolean;
  isTimeout: boolean;
  isNetworkError: boolean;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? null;
    this.code = options.code || 'API_ERROR';
    this.details = options.details;
    this.retryable = Boolean(options.retryable);
    this.isTimeout = Boolean(options.isTimeout);
    this.isNetworkError = Boolean(options.isNetworkError);
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

let tokenProvider: TokenProvider = readStoredToken;

export function setApiTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

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

function getHeaders(options: { skipAuth?: boolean } = {}): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (!options.skipAuth) {
    const token = tokenProvider() || readStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function shouldRetry(method: string, error: ApiError, attempt: number) {
  if (method !== 'GET' || attempt >= MAX_GET_RETRIES) return false;
  return error.retryable;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseErrorEnvelope(response: Response): Promise<ApiError> {
  const status = response.status;
  const fallbackMessage = `Request failed: ${status}`;

  let body: unknown = null;
  try {
    body = await response.clone().json();
  } catch {
    try {
      const text = await response.text();
      body = text ? { message: text } : null;
    } catch {
      body = null;
    }
  }

  const envelope = body as {
    message?: string;
    error?: string;
    code?: string;
    details?: unknown;
  } | null;

  return new ApiError(envelope?.message || envelope?.error || fallbackMessage, {
    status,
    code: envelope?.code || 'HTTP_ERROR',
    details: envelope?.details ?? body,
    retryable: status >= 500
  });
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (fetchError) {
    if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${timeoutMs}ms`, {
        code: 'REQUEST_TIMEOUT',
        isTimeout: true,
        retryable: true
      });
    }

    throw new ApiError(
      `Cannot connect to backend via ${url}. If running frontend on Vite dev server, keep VITE_API_BASE_URL empty to use proxy, or set it to your backend origin.`,
      {
        code: 'NETWORK_ERROR',
        details: fetchError,
        isNetworkError: true,
        retryable: true
      }
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path);
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipAuth = false,
    method: rawMethod,
    headers,
    ...rest
  } = options;

  const method = (rawMethod || 'GET').toUpperCase();
  const mergedHeaders = { ...getHeaders({ skipAuth }), ...(headers || {}) };

  for (let attempt = 0; attempt <= MAX_GET_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, { ...rest, method, headers: mergedHeaders }, timeoutMs);

      if (!response.ok) {
        throw await parseErrorEnvelope(response);
      }

      if (response.status === 204) return null as T;
      return response.json() as Promise<T>;
    } catch (error) {
      const apiError = error instanceof ApiError
        ? error
        : new ApiError('Unexpected request failure', { code: 'UNEXPECTED_ERROR', details: error });

      if (!shouldRetry(method, apiError, attempt)) throw apiError;
      await wait((attempt + 1) * 250);
    }
  }

  throw new ApiError('Request failed after retries', { code: 'RETRY_EXHAUSTED', retryable: false });
}

export const api = {
  // Foods
  getFoods(): Promise<FoodDto[]> {
    return request<FoodDto[]>('/api/foods');
  },
  createFood(payload: ApiPayload) {
    return request('/api/foods', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  deleteFood(id: string | number | undefined) {
    return request(`/api/foods/${id}`, { method: 'DELETE' });
  },
  getFoodRecipeStatus(id: string | number | undefined) {
    return request(`/api/foods/${id}/recipe-status`);
  },
  createRecipeForFood(foodId: string | number, payload: ApiPayload) {
    return request(`/api/foods/${foodId}/recipes`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Ingredients
  getIngredients(): Promise<IngredientDto[]> {
    return request<IngredientDto[]>('/api/ingredients');
  },
  createIngredient(payload: ApiPayload) {
    return request('/api/ingredients', {
      method: 'POST',
      body: JSON.stringify(normalizeIngredientPayload(payload))
    });
  },
  deleteIngredient(id: string | number | undefined) {
    return request(`/api/ingredients/${id}`, { method: 'DELETE' });
  },
  updateIngredient(id: string | number | null, payload: ApiPayload) {
    return request(`/api/ingredients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(normalizeIngredientPayload(payload))
    });
  },
  searchIngredientsByName(name: string) {
    return request(`/api/ingredients/search?name=${encodeURIComponent(name || '')}`);
  },
  searchIngredientsByNutrition(nutrient: string, minValue?: string | number | null) {
    const params = new URLSearchParams({ nutrient: normalizeNutrient(nutrient) || '' });
    if (minValue !== '' && minValue != null) params.set('minValue', String(minValue));
    return request(`/api/ingredients/search/by-nutrition?${params.toString()}`);
  },
  discoverSupermarkets(ingredientName: string, city?: string, userId?: string | number) {
    const params = new URLSearchParams({ ingredientName });
    if (city) params.set('city', city);
    if (userId) params.set('userId', String(userId));
    return request(`/api/ingredients/discover-supermarkets?${params.toString()}`);
  },

  // Recipes
  getRecipes(): Promise<RecipeDto[]> {
    return request<RecipeDto[]>('/api/recipes');
  },
  createRecipe(payload: ApiPayload) {
    return request('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  deleteRecipe(id: string | number | undefined) {
    return request(`/api/recipes/${id}`, { method: 'DELETE' });
  },
  updateRecipe(id: string | number | null, payload: ApiPayload) {
    return request(`/api/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  createRecipeForFoodViaRecipeApi(foodId: string | number, payload: ApiPayload) {
    return request(`/api/recipes/foods/${foodId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Auth (optional backend support)
  login(payload: { email: string; password: string }) {
    return request<{ token?: string; accessToken?: string; user?: { email?: string; name?: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true
    });
  },
  register(payload: { email: string; userName: string; password: string; profileImageUrl?: string }) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true
    });
  }
};
