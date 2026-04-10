import type { FoodDto, IngredientDto, RecipeDto } from './apiTypes';
const FALLBACK_PROD_API_BASE_URL = import.meta.env.VITE_PROD_API_BASE_URL || '';
const resolvedApiBaseUrl = import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV ? '' : FALLBACK_PROD_API_BASE_URL);
const API_BASE_URL = resolvedApiBaseUrl.replace(/\/$/, '');
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
export type PaginatedEnvelope<T> = {
  content?: T[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  number?: number;
  numberOfElements?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

type TokenProvider = () => string | null;

function readStoredToken() {
  try {
    const sessionToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (sessionToken) return sessionToken;
  } catch {
    // Ignore storage access errors and continue fallback chain.
  }

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

const inFlightGetRequests = new Map<string, Promise<unknown>>();

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

function getHeaderValue(headers: HeadersInit, name: string): string {
  if (headers instanceof Headers) return headers.get(name) || "";
  if (Array.isArray(headers)) {
    const entry = headers.find(([headerName]) => headerName.toLowerCase() === name.toLowerCase());
    return entry?.[1] || "";
  }

  const record = headers as Record<string, string>;
  return record[name] || record[name.toLowerCase()] || "";
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

function buildRegistrationIdempotencyKey(userName: string) {
  const randomSuffix = Math.floor(Math.random() * 10_000).toString().padStart(4, '0');
  return `reg-${userName}-${randomSuffix}`;
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

  const executeRequest = async () => {
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
  };

  if (method !== 'GET') return executeRequest();

  const authHeader = getHeaderValue(mergedHeaders, 'Authorization');
  const requestKey = `${method}:${url}:${authHeader}`;
  const existingRequest = inFlightGetRequests.get(requestKey);
  if (existingRequest) return existingRequest as Promise<T>;

  const nextRequest = executeRequest().finally(() => {
    if (inFlightGetRequests.get(requestKey) === nextRequest) {
      inFlightGetRequests.delete(requestKey);
    }
  });
  inFlightGetRequests.set(requestKey, nextRequest);
  return nextRequest as Promise<T>;
}

function appendPaginationParams(path: string, page: number, size?: number) {
  const separator = path.includes('?') ? '&' : '?';
  const base = `${path}${separator}page=${page}`;
  return typeof size === 'number' ? `${base}&size=${size}` : base;
}

function isPaginatedEnvelope<T>(payload: unknown): payload is PaginatedEnvelope<T> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const candidate = payload as PaginatedEnvelope<T>;
  return Array.isArray(candidate.content);
}

async function getAllPages<T>(path: string): Promise<T[]> {
  const firstResponse = await request<PaginatedEnvelope<T> | T[]>(path);
  if (Array.isArray(firstResponse)) return firstResponse;
  if (!isPaginatedEnvelope<T>(firstResponse)) return [];

  const aggregatedItems = [...(firstResponse.content ?? [])];
  const totalPages = typeof firstResponse.totalPages === 'number' ? firstResponse.totalPages : undefined;
  let currentPage = typeof firstResponse.number === 'number' ? firstResponse.number : 0;
  let isLastPage = Boolean(firstResponse.last);

  while (!isLastPage) {
    currentPage += 1;
    let nextResponse: PaginatedEnvelope<T> | T[];
    try {
      nextResponse = await request<PaginatedEnvelope<T> | T[]>(appendPaginationParams(path, currentPage));
    } catch {
      break;
    }
    if (Array.isArray(nextResponse)) {
      aggregatedItems.push(...nextResponse);
      break;
    }
    if (!isPaginatedEnvelope<T>(nextResponse)) break;
    aggregatedItems.push(...(nextResponse.content ?? []));
    isLastPage = Boolean(nextResponse.last);
    if (typeof totalPages === 'number' && currentPage >= totalPages - 1) break;
  }

  return aggregatedItems;
}

async function getPage<T>(path: string, page = 0, size = 20): Promise<PaginatedEnvelope<T>> {
  const response = await request<PaginatedEnvelope<T> | T[]>(appendPaginationParams(path, page, size));

  if (Array.isArray(response)) {
    const normalizedPage = Number.isFinite(page) ? page : 0;
    return {
      content: response,
      empty: response.length === 0,
      first: normalizedPage <= 0,
      last: true,
      number: normalizedPage,
      numberOfElements: response.length,
      size,
      totalElements: response.length,
      totalPages: 1
    };
  }

  if (!isPaginatedEnvelope<T>(response)) {
    return {
      content: [],
      empty: true,
      first: true,
      last: true,
      number: 0,
      numberOfElements: 0,
      size,
      totalElements: 0,
      totalPages: 0
    };
  }

  return {
    ...response,
    content: response.content ?? [],
    number: typeof response.number === 'number' ? response.number : page,
    size: typeof response.size === 'number' ? response.size : size,
    numberOfElements: typeof response.numberOfElements === 'number'
      ? response.numberOfElements
      : (response.content ?? []).length,
    totalElements: typeof response.totalElements === 'number'
      ? response.totalElements
      : (response.content ?? []).length,
    totalPages: typeof response.totalPages === 'number' ? response.totalPages : 1,
    first: typeof response.first === 'boolean' ? response.first : (response.number ?? page) <= 0,
    last: typeof response.last === 'boolean'
      ? response.last
      : ((response.number ?? page) >= ((response.totalPages ?? 1) - 1)),
    empty: typeof response.empty === 'boolean' ? response.empty : (response.content ?? []).length === 0
  };
}

export const api = {
  // Foods
  getFoods(): Promise<FoodDto[]> {
    return getAllPages<FoodDto>('/api/foods');
  },
  getFoodsPage(page = 0, size = 20): Promise<PaginatedEnvelope<FoodDto>> {
    return getPage<FoodDto>('/api/foods', page, size);
  },
  createFood(payload: ApiPayload) {
    return request('/api/foods', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updateFood(id: string | number | null, payload: ApiPayload) {
    return request(`/api/foods/${id}`, {
      method: 'PUT',
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
    return getAllPages<IngredientDto>('/api/ingredients');
  },
  getIngredientsPage(page = 0, size = 20): Promise<PaginatedEnvelope<IngredientDto>> {
    return getPage<IngredientDto>('/api/ingredients', page, size);
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
    if (userId != null) params.set('userId', String(userId));
    return request(`/api/ingredients/discover-supermarkets?${params.toString()}`);
  },

  // Recipes
  getRecipes(): Promise<RecipeDto[]> {
    return getAllPages<RecipeDto>('/api/recipes');
  },
  getRecipesPage(page = 0, size = 20): Promise<PaginatedEnvelope<RecipeDto>> {
    return getPage<RecipeDto>('/api/recipes', page, size);
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
    const idempotencyKey = buildRegistrationIdempotencyKey(payload.userName);
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Idempotency-Key': idempotencyKey,
        'X-Idempotency-Key': idempotencyKey
      },
      skipAuth: true
    });
  }
};
