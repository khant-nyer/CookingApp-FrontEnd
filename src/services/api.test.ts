import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, setApiTokenProvider } from './api';

describe('api hardening behavior', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it('retries GET once for retryable server failures', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'temporary' }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const data = await api.getFoods();

    expect(data).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
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

  it('exposes ApiError class type', () => {
    const err = new ApiError('failed', { status: 500, code: 'ERR', retryable: true });
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(500);
    expect(err.code).toBe('ERR');
  });
});
