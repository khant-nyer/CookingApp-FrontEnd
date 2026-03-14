import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_CONFIG_SIGNATURE_KEY,
  ID_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  bootstrapAuthSession,
  clearAuthSessionStorage,
  persistTokens,
  resolveBackendToken
} from './useAuthSessionStorage';

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createJwt(payload: Record<string, unknown>) {
  return `header.${base64UrlEncode(JSON.stringify(payload))}.signature`;
}

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

describe('useAuthSessionStorage', () => {
  const localStorageMock = new MemoryStorage();
  const sessionStorageMock = new MemoryStorage();

  const config = {
    authConfigSignature: 'next-signature',
    backendTokenUse: 'access' as const,
    tokenValidationConfig: {
      userPoolClientId: 'client-123',
      expectedIssuer: 'https://issuer.example/userpool'
    }
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true });
    Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock, configurable: true });
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  it('clears stored session when signature mismatches', () => {
    localStorage.setItem(AUTH_CONFIG_SIGNATURE_KEY, 'old-signature');
    sessionStorage.setItem(ID_TOKEN_STORAGE_KEY, 'id');
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'access');

    const result = bootstrapAuthSession(config);

    expect(result.token).toBeNull();
    expect(sessionStorage.getItem(ID_TOKEN_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('ignores malformed stored user JSON safely', () => {
    const exp = Math.floor(Date.now() / 1000) + 120;
    const idToken = createJwt({ exp, iss: config.tokenValidationConfig.expectedIssuer, token_use: 'id', aud: config.tokenValidationConfig.userPoolClientId });
    const accessToken = createJwt({ exp, iss: config.tokenValidationConfig.expectedIssuer, token_use: 'access', client_id: config.tokenValidationConfig.userPoolClientId });

    sessionStorage.setItem(ID_TOKEN_STORAGE_KEY, idToken);
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    sessionStorage.setItem(USER_STORAGE_KEY, '{oops');

    const result = bootstrapAuthSession(config);
    expect(result.user).toBeNull();
    expect(result.accessToken).toBe(accessToken);
  });


  it('persists backend token according to backendTokenUse', () => {
    persistTokens({
      idToken: 'id-token-value',
      accessToken: 'access-token-value',
      backendTokenUse: 'access'
    });

    expect(sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe('access-token-value');
    expect(sessionStorage.getItem(ID_TOKEN_STORAGE_KEY)).toBe('id-token-value');
    expect(sessionStorage.getItem('cooking_app_token')).toBe('access-token-value');

    clearAuthSessionStorage();

    persistTokens({
      idToken: 'id-token-value',
      accessToken: 'access-token-value',
      backendTokenUse: 'id'
    });

    expect(sessionStorage.getItem('cooking_app_token')).toBe('id-token-value');
  });

  it('resolves backend token from configured token type', () => {
    expect(resolveBackendToken('id-1', 'access-1', 'id')).toBe('id-1');
    expect(resolveBackendToken('id-1', 'access-1', 'access')).toBe('access-1');
  });

  it('returns null bootstrap object when tokens are missing', () => {
    const result = bootstrapAuthSession(config);

    expect(result).toEqual({ idToken: null, accessToken: null, refreshToken: null, user: null, token: null });
  });

  it('clears all auth session storage keys', () => {
    sessionStorage.setItem(ID_TOKEN_STORAGE_KEY, 'id');
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'access');
    sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'refresh');
    sessionStorage.setItem(USER_STORAGE_KEY, '{}');

    clearAuthSessionStorage();

    expect(sessionStorage.getItem(ID_TOKEN_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(USER_STORAGE_KEY)).toBeNull();
  });
});
