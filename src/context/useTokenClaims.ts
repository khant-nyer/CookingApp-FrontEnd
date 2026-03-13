export type TokenUse = 'access' | 'id';

export interface JwtPayload {
  exp?: number;
  iss?: string;
  token_use?: TokenUse;
  aud?: string;
  client_id?: string;
}

export interface TokenClaimsConfig {
  userPoolClientId?: string;
  expectedIssuer?: string;
}

function decodeBase64UrlSegment(segment: string) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
  return atob(padded);
}

export function decodeJwtPayload(token: string | null): JwtPayload | null {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(decodeBase64UrlSegment(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function parseTokenExpiry(token: string | null) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

export function isTokenClaimsValid(
  token: string | null,
  expectedUse: TokenUse,
  config: TokenClaimsConfig
) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp || !payload.iss || !payload.token_use) return false;
  if (!config.userPoolClientId || !config.expectedIssuer) return false;

  const now = Date.now();
  if (payload.exp * 1000 <= now) return false;
  if (payload.iss !== config.expectedIssuer) return false;
  if (payload.token_use !== expectedUse) return false;

  if (expectedUse === 'id') {
    return payload.aud === config.userPoolClientId;
  }

  return payload.client_id === config.userPoolClientId;
}
