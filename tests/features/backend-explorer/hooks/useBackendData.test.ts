import { describe, expect, it } from 'vitest';
import { extractCollection, mapLoadError } from '../../../../src/features/backend-explorer/hooks/useBackendData';
import { ApiError } from '../../../../src/services/api';

describe('extractCollection', () => {
  it('returns plain array payloads as-is', () => {
    const payload = [{ id: 1 }, { id: 2 }];
    expect(extractCollection(payload)).toEqual(payload);
  });

  it('supports common wrapped list keys', () => {
    expect(extractCollection({ data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
    expect(extractCollection({ items: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(extractCollection({ content: [{ id: 3 }] })).toEqual([{ id: 3 }]);
  });


  it('supports nested wrapped list payloads', () => {
    expect(extractCollection({ data: { content: [{ id: 4 }] } })).toEqual([{ id: 4 }]);
    expect(extractCollection({ payload: { result: [{ id: 5 }] } })).toEqual([{ id: 5 }]);
  });


  it('supports entity-specific keys inside nested wrappers', () => {
    expect(extractCollection({ data: { foods: [{ id: 10 }] } }, 0, ['foods'])).toEqual([{ id: 10 }]);
    expect(extractCollection({ payload: { ingredients: [{ id: 11 }] } }, 0, ['ingredients'])).toEqual([{ id: 11 }]);
    expect(extractCollection({ result: { recipes: [{ id: 12 }] } }, 0, ['recipes'])).toEqual([{ id: 12 }]);
  });

  it('supports case-insensitive entity keys and unknown wrapper names', () => {
    expect(extractCollection({ data: { Foods: [{ id: 20 }] } }, 0, ['foods'])).toEqual([{ id: 20 }]);
    expect(extractCollection({ response: { ingredients: [{ id: 21 }] } }, 0, ['ingredients'])).toEqual([{ id: 21 }]);
    expect(extractCollection({ body: { payload: { Recipes: [{ id: 22 }] } } }, 0, ['recipes'])).toEqual([{ id: 22 }]);
  });

  it('supports unknown collection key names that directly contain entity arrays', () => {
    expect(extractCollection({ foodsList: [{ id: 30 }] }, 0, ['foods'])).toEqual([{ id: 30 }]);
    expect(extractCollection({ response: { dataRows: [{ id: 31 }] } }, 0, ['ingredients'])).toEqual([{ id: 31 }]);
  });


  it('supports JSON-stringified payload envelopes from proxy integrations', () => {
    expect(extractCollection('{"foods":[{"id":40}]}', 0, ['foods'])).toEqual([{ id: 40 }]);
    expect(extractCollection({ body: '[{"id":41}]' }, 0, ['ingredients'])).toEqual([{ id: 41 }]);
    expect(
      extractCollection({ body: '"[{\\"id\\":42}]"' }, 0, ['recipes'])
    ).toEqual([{ id: 42 }]);
  });

  it('returns empty list for unsupported payload shapes', () => {
    expect(extractCollection({})).toEqual([]);
    expect(extractCollection({ wrapped: ['row'] })).toEqual([]);
    expect(extractCollection(null)).toEqual([]);
  });
});

describe('mapLoadError', () => {
  it('maps network failures to a CORS/API configuration guidance message', () => {
    const error = new ApiError('Cannot connect to backend via https://example.com', {
      code: 'NETWORK_ERROR',
      isNetworkError: true
    });

    expect(mapLoadError(error, 'fallback')).toBe(
      'Cannot connect to the backend. This is usually a CORS or API URL configuration issue. If you are using the Vite dev server, leave VITE_API_BASE_URL empty to use the proxy.'
    );
  });

  it('returns http-specific mapped message for 404 errors', () => {
    const error = new ApiError('Request failed', { status: 404 });
    expect(mapLoadError(error, 'fallback')).toBe(
      'Backend endpoint was not found (404). Please start the backend service or verify the API URL.'
    );
  });
});
