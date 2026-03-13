import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { api, setApiTokenProvider } from '../services/api';
import {
  confirmEmailVerification,
  confirmForgotPassword as confirmForgotPasswordWithCognito,
  isExpiredSessionError,
  loginWithCognito,
  logoutFromCognito,
  resendEmailVerificationCode,
  startForgotPassword
} from '../services/cognitoAuth';
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
    const expiryTime = parseTokenExpiry(accessToken);
    if (!expiryTime) return;

    const timeLeftMs = expiryTime - Date.now();
    if (timeLeftMs <= 0) {
      clearLocalAuthState();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearLocalAuthState();
    }, timeLeftMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [accessToken, clearLocalAuthState]);

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
      login,
      register,
      verifyEmail,
      resendVerificationCode,
      forgotPassword,
      confirmForgotPassword,
      logout,
      isAuthenticated: Boolean(token)
    }),
    [token, user, login, register, verifyEmail, resendVerificationCode, forgotPassword, confirmForgotPassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
