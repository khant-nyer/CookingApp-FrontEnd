import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeJwtPayload, isTokenClaimsValid, parseTokenExpiry } from './useTokenClaims';

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createJwt(payload: Record<string, unknown>) {
  return `header.${base64UrlEncode(JSON.stringify(payload))}.signature`;
}

describe('useTokenClaims', () => {
  const config = {
    userPoolClientId: 'client-123',
    expectedIssuer: 'https://issuer.example/userpool'
  };

  beforeEach(() => {
    vi.useRealTimers();
  });

  it('returns true for valid id/access token claims', () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    const idToken = createJwt({ exp, iss: config.expectedIssuer, token_use: 'id', aud: config.userPoolClientId });
    const accessToken = createJwt({ exp, iss: config.expectedIssuer, token_use: 'access', client_id: config.userPoolClientId });

    expect(isTokenClaimsValid(idToken, 'id', config)).toBe(true);
    expect(isTokenClaimsValid(accessToken, 'access', config)).toBe(true);
  });

  it('returns false for wrong issuer and wrong audience/client', () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    const wrongIssuer = createJwt({ exp, iss: 'https://other', token_use: 'id', aud: config.userPoolClientId });
    const wrongAud = createJwt({ exp, iss: config.expectedIssuer, token_use: 'id', aud: 'bad-client' });
    const wrongClient = createJwt({ exp, iss: config.expectedIssuer, token_use: 'access', client_id: 'bad-client' });

    expect(isTokenClaimsValid(wrongIssuer, 'id', config)).toBe(false);
    expect(isTokenClaimsValid(wrongAud, 'id', config)).toBe(false);
    expect(isTokenClaimsValid(wrongClient, 'access', config)).toBe(false);
  });

  it('returns false for expired token', () => {
    const exp = Math.floor(Date.now() / 1000) - 1;
    const expired = createJwt({ exp, iss: config.expectedIssuer, token_use: 'access', client_id: config.userPoolClientId });

    expect(isTokenClaimsValid(expired, 'access', config)).toBe(false);
  });

  it('decodes payload with base64url padding edge case', () => {
    const token = createJwt({ exp: 1_700_000_000, iss: config.expectedIssuer, token_use: 'id', aud: config.userPoolClientId });

    expect(decodeJwtPayload(token)?.token_use).toBe('id');
    expect(parseTokenExpiry(token)).toBe(1_700_000_000_000);
  });
});
