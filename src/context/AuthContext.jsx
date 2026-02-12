import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_STORAGE_KEY = 'cooking_app_token';
const USER_STORAGE_KEY = 'cooking_app_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  async function login(email, password) {
    const data = await api.login({ email, password });
    const nextToken = data.token || data.accessToken;
    const nextUser = data.user || { email };

    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  }

  async function register(name, email, password) {
    await api.register({ name, email, password });
    await login(email, password);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  const value = useMemo(
    () => ({ token, user, login, register, logout, isAuthenticated: Boolean(token) }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
