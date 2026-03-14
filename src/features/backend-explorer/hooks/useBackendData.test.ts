import { describe, expect, it } from 'vitest';
import { extractCollection } from './useBackendData';

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

  it('returns empty list for unsupported payload shapes', () => {
    expect(extractCollection({})).toEqual([]);
    expect(extractCollection({ wrapped: [{ id: 1 }] })).toEqual([]);
    expect(extractCollection(null)).toEqual([]);
  });
});
