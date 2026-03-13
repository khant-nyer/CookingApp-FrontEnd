import { createContext } from 'react';

export interface AuthUser {
  email?: string;
  name?: string;
  userId?: string;
}

export interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isExpiryWarningOpen: boolean;
  secondsToExpiry: number;
  login: (email: string, password: string) => Promise<void>;
  register: (userName: string, email: string, password: string, profileImageUrl?: string) => Promise<void>;
  verifyEmail: (email: string, code: string, password: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  dismissExpiryWarning: () => void;
  extendSession: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
