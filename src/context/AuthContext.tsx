import { useCallback, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { api } from '../services/api';
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

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login({ email, password });
    const nextToken = data.token || data.accessToken || '';
    const nextUser = data.user || { email };

    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await api.register({ name, email, password });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ token, user, login, register, logout, isAuthenticated: Boolean(token) }),
    [token, user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
