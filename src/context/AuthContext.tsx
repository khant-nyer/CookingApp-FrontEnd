import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { api, setApiTokenProvider } from '../services/api';
import {
  confirmForgotPassword as confirmForgotPasswordWithCognito,
  loginWithCognito,
  logoutFromCognito,
  startForgotPassword
} from '../services/cognitoAuth';
import { AuthContext } from './auth-context';
import type { AuthUser } from './auth-context';

const BACKEND_TOKEN_USE = import.meta.env.VITE_COGNITO_BACKEND_TOKEN_USE === 'id' ? 'id' : 'access';
const TOKEN_STORAGE_KEY = 'cooking_app_token';
const ID_TOKEN_STORAGE_KEY = 'cooking_app_id_token';
const ACCESS_TOKEN_STORAGE_KEY = 'cooking_app_access_token';
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

function resolveBackendToken(idToken: string | null, accessToken: string | null) {
  return BACKEND_TOKEN_USE === 'id' ? idToken : accessToken;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [idToken, setIdToken] = useState<string | null>(() => {
    const previousSignature = localStorage.getItem(AUTH_CONFIG_SIGNATURE_KEY);
    if (previousSignature && previousSignature !== AUTH_CONFIG_SIGNATURE) {
      localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
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

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginWithCognito(email, password);
    const nextUser = { email: data.email, userId: data.userId };

    setIdToken(data.idToken);
    setAccessToken(data.accessToken);
    setUser(nextUser);

    localStorage.setItem(ID_TOKEN_STORAGE_KEY, data.idToken);
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await api.register({ name, email, password });
    await login(email, password);
  }, [login]);

  const forgotPassword = useCallback(async (email: string) => {
    await startForgotPassword(email);
  }, []);

  const confirmForgotPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await confirmForgotPasswordWithCognito(email, code, newPassword);
  }, []);

  const logout = useCallback(async () => {
    await logoutFromCognito(accessToken);
    setIdToken(null);
    setAccessToken(null);
    setToken(null);
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, [accessToken]);

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      register,
      forgotPassword,
      confirmForgotPassword,
      logout,
      isAuthenticated: Boolean(token)
    }),
    [token, user, login, register, forgotPassword, confirmForgotPassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
