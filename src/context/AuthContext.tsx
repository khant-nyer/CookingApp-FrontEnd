import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { api, setApiTokenProvider } from '../services/api';
import {
  confirmEmailVerification,
  confirmForgotPassword as confirmForgotPasswordWithCognito,
  isExpiredSessionError,
  loginWithCognito,
  logoutFromCognito,
  refreshSessionWithCognito,
  resendEmailVerificationCode,
  startForgotPassword
} from '../services/cognitoAuth';
import { getFriendlyAuthErrorMessage, isUnrecoverableSessionExtensionError } from '../services/authErrorMessages';
import { calculateSecondsToExpiry, calculateSessionTiming } from './authSessionTimers';
import { executeExtendSession } from './extendSessionFlow';
import { AuthContext } from './auth-context';
import type { AuthUser } from './auth-context';

const BACKEND_TOKEN_USE = import.meta.env.VITE_COGNITO_BACKEND_TOKEN_USE === 'id' ? 'id' : 'access';
const TOKEN_STORAGE_KEY = 'cooking_app_token';
const ID_TOKEN_STORAGE_KEY = 'cooking_app_id_token';
const ACCESS_TOKEN_STORAGE_KEY = 'cooking_app_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'cooking_app_refresh_token';
const USER_STORAGE_KEY = 'cooking_app_user';
const AUTH_CONFIG_SIGNATURE_KEY = 'cooking_app_auth_config_signature';
const AUTH_CONFIG_SIGNATURE = [
  import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  import.meta.env.VITE_COGNITO_REGION || '',
  import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || '',
  BACKEND_TOKEN_USE
].join('|');
const EXPIRY_WARNING_WINDOW_MS = 5 * 60 * 1000;
const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined;
const USER_POOL_CLIENT_ID = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID as string | undefined;
const USER_POOL_REGION =
  (import.meta.env.VITE_COGNITO_REGION as string | undefined) || USER_POOL_ID?.split('_')[0] || undefined;
const EXPECTED_ISSUER = USER_POOL_REGION && USER_POOL_ID ? `https://cognito-idp.${USER_POOL_REGION}.amazonaws.com/${USER_POOL_ID}` : '';

type JwtPayload = {
  exp?: number;
  iss?: string;
  token_use?: 'access' | 'id';
  aud?: string;
  client_id?: string;
};

function resolveBackendToken(idToken: string | null, accessToken: string | null) {
  return BACKEND_TOKEN_USE === 'id' ? idToken : accessToken;
}

function decodeJwtPayload(token: string | null): JwtPayload | null {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function parseTokenExpiry(token: string | null) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

function isTokenClaimsValid(token: string | null, expectedUse: 'access' | 'id') {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp || !payload.iss || !payload.token_use) return false;
  if (!USER_POOL_CLIENT_ID || !EXPECTED_ISSUER) return false;

  const now = Date.now();
  if (payload.exp * 1000 <= now) return false;
  if (payload.iss !== EXPECTED_ISSUER) return false;
  if (payload.token_use !== expectedUse) return false;

  if (expectedUse === 'id') {
    return payload.aud === USER_POOL_CLIENT_ID;
  }

  return payload.client_id === USER_POOL_CLIENT_ID;
}

function clearStoredSession() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

function parseStoredUser(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function bootstrapStoredSession() {
  const previousSignature = localStorage.getItem(AUTH_CONFIG_SIGNATURE_KEY);
  if (previousSignature && previousSignature !== AUTH_CONFIG_SIGNATURE) {
    clearStoredSession();
    return { idToken: null, accessToken: null, refreshToken: null, user: null, token: null };
  }

  const storedIdToken = sessionStorage.getItem(ID_TOKEN_STORAGE_KEY);
  const storedAccessToken = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

  if (!isTokenClaimsValid(storedIdToken, 'id') || !isTokenClaimsValid(storedAccessToken, 'access')) {
    clearStoredSession();
    return { idToken: null, accessToken: null, refreshToken: null, user: null, token: null };
  }

  const token = resolveBackendToken(storedIdToken, storedAccessToken);

  return {
    idToken: storedIdToken,
    accessToken: storedAccessToken,
    refreshToken: sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
    user: parseStoredUser(sessionStorage.getItem(USER_STORAGE_KEY)),
    token
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const warningTimeoutRef = useRef<number | null>(null);
  const expiryTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const bootstrappedSession = useMemo(() => bootstrapStoredSession(), []);
  const [idToken, setIdToken] = useState<string | null>(bootstrappedSession.idToken);
  const [accessToken, setAccessToken] = useState<string | null>(bootstrappedSession.accessToken);
  const [token, setToken] = useState<string | null>(bootstrappedSession.token);
  const [refreshToken, setRefreshToken] = useState<string | null>(bootstrappedSession.refreshToken);
  const [user, setUser] = useState<AuthUser | null>(bootstrappedSession.user);
  const [isExpiryWarningOpen, setIsExpiryWarningOpen] = useState(false);
  const [secondsToExpiry, setSecondsToExpiry] = useState(0);

  useEffect(() => {
    localStorage.setItem(AUTH_CONFIG_SIGNATURE_KEY, AUTH_CONFIG_SIGNATURE);
  }, []);

  useEffect(() => {
    const idClaimsValid = isTokenClaimsValid(idToken, 'id');
    const accessClaimsValid = isTokenClaimsValid(accessToken, 'access');

    if (!idToken || !accessToken || !idClaimsValid || !accessClaimsValid) {
      setToken(null);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      if (idToken || accessToken) {
        setIdToken(null);
        setAccessToken(null);
      }
      return;
    }

    const resolvedToken = resolveBackendToken(idToken, accessToken);
    setToken(resolvedToken);

    if (resolvedToken) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, resolvedToken);
    }
  }, [idToken, accessToken]);

  useEffect(() => {
    setApiTokenProvider(() => token);
  }, [token]);

  const clearLocalAuthState = useCallback(() => {
    setIdToken(null);
    setAccessToken(null);
    setRefreshToken(null);
    setToken(null);
    setUser(null);
    clearStoredSession();
    setIsExpiryWarningOpen(false);
    setSecondsToExpiry(0);
  }, []);

  const clearAuthListenerTimers = useCallback(() => {
    if (warningTimeoutRef.current !== null) {
      window.clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    if (expiryTimeoutRef.current !== null) {
      window.clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }

    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startExpiryCountdown = useCallback((expiryTimeMs: number) => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    const updateCountdown = () => {
      const secondsLeft = calculateSecondsToExpiry(expiryTimeMs, Date.now());
      setSecondsToExpiry(secondsLeft);

      if (secondsLeft <= 0 && countdownIntervalRef.current !== null) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };

    updateCountdown();
    countdownIntervalRef.current = window.setInterval(updateCountdown, 1000);
  }, []);

  const updateSession = useCallback(
    (nextSession: { idToken: string; accessToken: string; refreshToken?: string | null }, nextUser?: AuthUser | null) => {
      if (!isTokenClaimsValid(nextSession.idToken, 'id') || !isTokenClaimsValid(nextSession.accessToken, 'access')) {
        clearLocalAuthState();
        throw new Error('Received invalid authentication token claims. Please sign in again.');
      }

      setIdToken(nextSession.idToken);
      setAccessToken(nextSession.accessToken);
      setRefreshToken(nextSession.refreshToken ?? refreshToken);

      sessionStorage.setItem(ID_TOKEN_STORAGE_KEY, nextSession.idToken);
      sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, nextSession.accessToken);

      const effectiveRefreshToken = nextSession.refreshToken ?? refreshToken;
      if (effectiveRefreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, effectiveRefreshToken);
      }

      if (nextUser) {
        setUser(nextUser);
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      }
    },
    [refreshToken, clearLocalAuthState]
  );

  useEffect(() => {
    clearAuthListenerTimers();
    setIsExpiryWarningOpen(false);
    setSecondsToExpiry(0);

    const expiryTime = parseTokenExpiry(accessToken);
    if (!accessToken || !expiryTime) return;

    const timing = calculateSessionTiming(expiryTime, Date.now(), EXPIRY_WARNING_WINDOW_MS);
    if (!timing) {
      clearLocalAuthState();
      return;
    }

    warningTimeoutRef.current = window.setTimeout(() => {
      setIsExpiryWarningOpen(true);
      startExpiryCountdown(expiryTime);
    }, timing.warningDelayMs);

    expiryTimeoutRef.current = window.setTimeout(() => {
      clearLocalAuthState();
    }, timing.expiryDelayMs);

    return () => {
      clearAuthListenerTimers();
    };
  }, [accessToken, clearAuthListenerTimers, clearLocalAuthState, startExpiryCountdown]);

  const dismissExpiryWarning = useCallback(() => {
    setIsExpiryWarningOpen(false);
  }, []);

  const extendSession = useCallback(async () => {
    try {
      await executeExtendSession({
        refreshToken,
        refreshSession: refreshSessionWithCognito,
        updateSession,
        onExtended: () => {
          setIsExpiryWarningOpen(false);
          setSecondsToExpiry(0);
        },
        clearLocalAuthState,
        toFriendlyMessage: (error) => getFriendlyAuthErrorMessage(error, 'extend-session'),
        isUnrecoverableError: isUnrecoverableSessionExtensionError
      });
    } catch (error) {
      console.error('Session extension failed', error);
      throw error;
    }
  }, [refreshToken, updateSession, clearLocalAuthState]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await loginWithCognito(email, password);
      const nextUser = { email: data.email, userId: data.userId };

      updateSession(
        { idToken: data.idToken, accessToken: data.accessToken, refreshToken: data.refreshToken ?? null },
        nextUser
      );
    },
    [updateSession]
  );

  const register = useCallback(async (userName: string, email: string, password: string, profileImageUrl?: string) => {
    await api.register({
      email,
      userName,
      password,
      ...(profileImageUrl ? { profileImageUrl } : {})
    });
  }, []);

  const verifyEmail = useCallback(
    async (email: string, code: string, password: string) => {
      await confirmEmailVerification(email, code);
      await login(email, password);
    },
    [login]
  );

  const resendVerificationCode = useCallback(async (email: string) => {
    await resendEmailVerificationCode(email);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await startForgotPassword(email);
  }, []);

  const confirmForgotPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await confirmForgotPasswordWithCognito(email, code, newPassword);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutFromCognito(accessToken);
    } catch (error) {
      if (!isExpiredSessionError(error)) {
        throw error;
      }
    } finally {
      clearLocalAuthState();
    }
  }, [accessToken, clearLocalAuthState]);

  const value = useMemo(
    () => ({
      token,
      user,
      isExpiryWarningOpen,
      secondsToExpiry,
      login,
      register,
      verifyEmail,
      resendVerificationCode,
      forgotPassword,
      confirmForgotPassword,
      dismissExpiryWarning,
      extendSession,
      logout,
      isAuthenticated: Boolean(token)
    }),
    [
      token,
      user,
      isExpiryWarningOpen,
      secondsToExpiry,
      login,
      register,
      verifyEmail,
      resendVerificationCode,
      forgotPassword,
      confirmForgotPassword,
      dismissExpiryWarning,
      extendSession,
      logout
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
