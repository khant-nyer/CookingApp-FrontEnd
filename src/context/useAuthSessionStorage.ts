import type { AuthUser } from './auth-context';
import { isTokenClaimsValid } from './useTokenClaims';

export const TOKEN_STORAGE_KEY = 'cooking_app_token';
export const ID_TOKEN_STORAGE_KEY = 'cooking_app_id_token';
export const ACCESS_TOKEN_STORAGE_KEY = 'cooking_app_access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'cooking_app_refresh_token';
export const USER_STORAGE_KEY = 'cooking_app_user';
export const AUTH_CONFIG_SIGNATURE_KEY = 'cooking_app_auth_config_signature';

export interface SessionStorageConfig {
  authConfigSignature: string;
  backendTokenUse: 'id' | 'access';
  tokenValidationConfig: {
    userPoolClientId?: string;
    expectedIssuer?: string;
  };
}

export function resolveBackendToken(idToken: string | null, accessToken: string | null, backendTokenUse: 'id' | 'access') {
  return backendTokenUse === 'id' ? idToken : accessToken;
}

export function clearAuthSessionStorage() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function persistTokens(params: {
  idToken: string;
  accessToken: string;
  refreshToken?: string | null;
  backendTokenUse: 'id' | 'access';
}) {
  const { idToken, accessToken, refreshToken, backendTokenUse } = params;
  sessionStorage.setItem(ID_TOKEN_STORAGE_KEY, idToken);
  sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);

  const backendToken = resolveBackendToken(idToken, accessToken, backendTokenUse);
  if (backendToken) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, backendToken);
  }

  if (refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
}

export function persistUser(user: AuthUser) {
  sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function parseStoredUser(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function bootstrapAuthSession(config: SessionStorageConfig) {
  const previousSignature = localStorage.getItem(AUTH_CONFIG_SIGNATURE_KEY);
  if (previousSignature && previousSignature !== config.authConfigSignature) {
    clearAuthSessionStorage();
    return { idToken: null, accessToken: null, refreshToken: null, user: null, token: null };
  }

  const storedIdToken = sessionStorage.getItem(ID_TOKEN_STORAGE_KEY);
  const storedAccessToken = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

  if (!storedIdToken || !storedAccessToken) {
    return { idToken: null, accessToken: null, refreshToken: null, user: null, token: null };
  }

  const idValid = isTokenClaimsValid(storedIdToken, 'id', config.tokenValidationConfig);
  const accessValid = isTokenClaimsValid(storedAccessToken, 'access', config.tokenValidationConfig);

  if (!idValid || !accessValid) {
    clearAuthSessionStorage();
    return { idToken: null, accessToken: null, refreshToken: null, user: null, token: null };
  }

  return {
    idToken: storedIdToken,
    accessToken: storedAccessToken,
    refreshToken: sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
    user: parseStoredUser(sessionStorage.getItem(USER_STORAGE_KEY)),
    token: resolveBackendToken(storedIdToken, storedAccessToken, config.backendTokenUse)
  };
}
