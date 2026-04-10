import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, setApiTokenProvider } from '../../src/services/api';

function createStorageMock() {
  const state = new Map<string, string>();

  return {
    getItem(key: string) {
      return state.has(key) ? state.get(key)! : null;
    },
    setItem(key: string, value: string) {
      state.set(key, String(value));
    },
    removeItem(key: string) {
      state.delete(key);
    },
    clear() {
      state.clear();
    }
  };
}

describe('api hardening behavior', () => {
  const localStorageMock = createStorageMock();
  const sessionStorageMock = createStorageMock();

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('sessionStorage', sessionStorageMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    setApiTokenProvider(() => null);
  });

  it('adds bearer auth header from token provider', async () => {
    setApiTokenProvider(() => 'token-123');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    await api.getFoods();

    const requestInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = requestInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-123');
  });

  it('uses sessionStorage token before localStorage fallback when provider is empty', async () => {
    setApiTokenProvider(() => null);
    sessionStorage.setItem('cooking_app_token', 'session-token');
    localStorage.setItem('cooking_app_token', 'local-token');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    await api.getFoods();

    const requestInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = requestInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer session-token');
  });

  it('normalizes error envelope and throws ApiError with status/code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      message: 'Invalid request',
      code: 'BAD_INPUT',
      details: { field: 'name' }
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }));

    await expect(api.createFood({ name: 'Test' })).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Invalid request',
      status: 400,
      code: 'BAD_INPUT'
    });
  });

  it('maps network failures to retryable ApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    await expect(api.getFoods()).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NETWORK_ERROR',
      retryable: true,
      isNetworkError: true
    });
  });

  it('skips auth header for auth endpoints', async () => {
    setApiTokenProvider(() => 'token-abc');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ token: 'x' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    await api.login({ email: 'a@b.com', password: '123' });

    const requestInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = requestInit.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('adds registration idempotency header with expected format', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3245);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    await api.register({ email: 'chef@example.com', userName: 'cheft', password: 'secret123' });

    const requestInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = requestInit.headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toBe('reg-cheft-3245');
    expect(headers['X-Idempotency-Key']).toBe('reg-cheft-3245');
  });

  it('retries GET once for retryable server failures', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'temporary' }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const data = await api.getFoods();

    expect(data).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('aggregates paginated GET list responses', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        content: [{ id: 1 }],
        number: 0,
        last: false,
        totalPages: 2
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        content: [{ id: 2 }],
        number: 1,
        last: true,
        totalPages: 2
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const data = await api.getIngredients();

    expect(data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1]?.[0]).toContain('/api/ingredients?page=1');
  });

  it('returns already fetched paginated data when later pages fail', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        content: [{ id: 1 }],
        number: 0,
        last: false,
        totalPages: 2
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockRejectedValueOnce(new Error('network error'));

    const data = await api.getIngredients();
    expect(data).toEqual([{ id: 1 }]);
  });

  it('does not retry non-GET requests when failing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'temporary' }), { status: 503 }));

    await expect(api.createFood({ name: 'Test' })).rejects.toBeInstanceOf(ApiError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('normalizes ingredient nutrients for create and update requests', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));

    const payload = {
      name: 'Sugar',
      nutritionList: [
        { nutrient: 'total sugars', value: 5, unit: 'G' },
        { nutrient: 'added sugar', value: 1, unit: 'G' }
      ]
    };

    await api.createIngredient(payload);
    await api.updateIngredient('ingredient-1', payload);

    const firstBody = JSON.parse(String((fetchSpy.mock.calls[0]?.[1] as RequestInit).body));
    const secondBody = JSON.parse(String((fetchSpy.mock.calls[1]?.[1] as RequestInit).body));

    expect(firstBody.nutritionList[0].nutrient).toBe('SUGARS');
    expect(firstBody.nutritionList[1].nutrient).toBe('ADDED_SUGARS');
    expect(secondBody.nutritionList[0].nutrient).toBe('SUGARS');
    expect(secondBody.nutritionList[1].nutrient).toBe('ADDED_SUGARS');
  });


  it('includes discoverSupermarkets userId when set to 0', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    await api.discoverSupermarkets('salt', 'Boston', 0);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('userId=0');
  });

  it('exposes ApiError class type', () => {
    const err = new ApiError('failed', { status: 500, code: 'ERR', retryable: true });
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(500);
    expect(err.code).toBe('ERR');
  });
});
