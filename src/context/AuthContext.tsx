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



function resolveBackendToken(idToken: string | null, accessToken: string | null) {
  return BACKEND_TOKEN_USE === 'id' ? idToken : accessToken;
}

function parseTokenExpiry(token: string | null) {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    const data = JSON.parse(decoded) as { exp?: number };
    if (!data.exp) return null;
    return data.exp * 1000;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const warningTimeoutRef = useRef<number | null>(null);
  const expiryTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const [idToken, setIdToken] = useState<string | null>(() => {
    const previousSignature = localStorage.getItem(AUTH_CONFIG_SIGNATURE_KEY);
    if (previousSignature && previousSignature !== AUTH_CONFIG_SIGNATURE) {
      localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      return null;
    }
    return localStorage.getItem(ID_TOKEN_STORAGE_KEY);
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const previousSignature = localStorage.getItem(AUTH_CONFIG_SIGNATURE_KEY);
    if (previousSignature && previousSignature !== AUTH_CONFIG_SIGNATURE) {
      return null;
    }
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  });
  const [token, setToken] = useState<string | null>(() =>
    resolveBackendToken(localStorage.getItem(ID_TOKEN_STORAGE_KEY), localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY))
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    const previousSignature = localStorage.getItem(AUTH_CONFIG_SIGNATURE_KEY);
    if (previousSignature && previousSignature !== AUTH_CONFIG_SIGNATURE) {
      return null;
    }
    return sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });
  const [isExpiryWarningOpen, setIsExpiryWarningOpen] = useState(false);
  const [secondsToExpiry, setSecondsToExpiry] = useState(0);

  useEffect(() => {
    localStorage.setItem(AUTH_CONFIG_SIGNATURE_KEY, AUTH_CONFIG_SIGNATURE);
  }, []);

  useEffect(() => {
    const resolvedToken = resolveBackendToken(idToken, accessToken);
    setToken(resolvedToken);

    if (resolvedToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, resolvedToken);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
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
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
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
      const secondsLeft = Math.max(0, Math.ceil((expiryTimeMs - Date.now()) / 1000));
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
      setIdToken(nextSession.idToken);
      setAccessToken(nextSession.accessToken);
      setRefreshToken(nextSession.refreshToken ?? refreshToken);

      localStorage.setItem(ID_TOKEN_STORAGE_KEY, nextSession.idToken);
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, nextSession.accessToken);

      const effectiveRefreshToken = nextSession.refreshToken ?? refreshToken;
      if (effectiveRefreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, effectiveRefreshToken);
      }

      if (nextUser) {
        setUser(nextUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      }
    },
    [refreshToken]
  );

  useEffect(() => {
    clearAuthListenerTimers();
    setIsExpiryWarningOpen(false);
    setSecondsToExpiry(0);

    const expiryTime = parseTokenExpiry(accessToken);
    if (!accessToken || !expiryTime) return;

    const timeLeftMs = expiryTime - Date.now();
    if (timeLeftMs <= 0) {
      clearLocalAuthState();
      return;
    }

    const warningDelayMs = Math.max(0, timeLeftMs - EXPIRY_WARNING_WINDOW_MS);
    warningTimeoutRef.current = window.setTimeout(() => {
      setIsExpiryWarningOpen(true);
      startExpiryCountdown(expiryTime);
    }, warningDelayMs);

    expiryTimeoutRef.current = window.setTimeout(() => {
      clearLocalAuthState();
    }, timeLeftMs);

    return () => {
      clearAuthListenerTimers();
    };
  }, [accessToken, clearAuthListenerTimers, clearLocalAuthState, startExpiryCountdown]);

  const dismissExpiryWarning = useCallback(() => {
    setIsExpiryWarningOpen(false);
  }, []);

  const extendSession = useCallback(async () => {
    if (!refreshToken) {
      throw new Error(getFriendlyAuthErrorMessage(new Error('missing refresh token'), 'extend-session'));
    }

    try {
      const refreshedSession = await refreshSessionWithCognito(refreshToken);
      updateSession({
        idToken: refreshedSession.idToken,
        accessToken: refreshedSession.accessToken,
        refreshToken: refreshedSession.refreshToken ?? refreshToken
      });

      setIsExpiryWarningOpen(false);
      setSecondsToExpiry(0);
    } catch (error) {
      console.error('Session extension failed', error);
      const friendlyMessage = getFriendlyAuthErrorMessage(error, 'extend-session');

      if (isUnrecoverableSessionExtensionError(error)) {
        clearLocalAuthState();
      }

      throw new Error(friendlyMessage);
    }
  }, [refreshToken, updateSession, clearLocalAuthState]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginWithCognito(email, password);
    const nextUser = { email: data.email, userId: data.userId };

    updateSession(
      { idToken: data.idToken, accessToken: data.accessToken, refreshToken: data.refreshToken ?? null },
      nextUser
    );
  }, [updateSession]);

  const register = useCallback(async (userName: string, email: string, password: string, profileImageUrl?: string) => {
    await api.register({
      email,
      userName,
      password,
      ...(profileImageUrl ? { profileImageUrl } : {})
    });
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string, password: string) => {
    await confirmEmailVerification(email, code);
    await login(email, password);
  }, [login]);

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
