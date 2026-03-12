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

const TOKEN_STORAGE_KEY = 'cooking_app_token';
const USER_STORAGE_KEY = 'cooking_app_user';

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
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
    setApiTokenProvider(() => token);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginWithCognito(email, password);
    const nextToken = data.accessToken;
    const nextUser = { email: data.email, userId: data.userId };

    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
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
    await logoutFromCognito(token);
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, [token]);

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
