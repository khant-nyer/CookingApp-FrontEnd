import { createContext } from 'react';

export interface AuthUser {
  id?: number;
  userName?: string;
  email?: string;
  emailVerified?: boolean;
  accountStatus?: string;
  role?: string;
  profileImageUrl?: string;
  cognitoSub?: string;
  allergies?: string[];
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
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  dismissExpiryWarning: () => void;
  extendSession: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
