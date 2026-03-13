import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { executeExtendSession } from './extendSessionFlow';
import { AuthContext } from './auth-context';
import type { AuthUser } from './auth-context';
import {
  AUTH_CONFIG_SIGNATURE_KEY,
  bootstrapAuthSession,
  clearAuthSessionStorage,
  persistTokens,
  persistUser,
  resolveBackendToken,
  TOKEN_STORAGE_KEY
} from './useAuthSessionStorage';
import { useSessionExpiryTimers } from './useSessionExpiryTimers';
import { isTokenClaimsValid } from './useTokenClaims';

const BACKEND_TOKEN_USE = import.meta.env.VITE_COGNITO_BACKEND_TOKEN_USE === 'id' ? 'id' : 'access';
const EXPIRY_WARNING_WINDOW_MS = 5 * 60 * 1000;
const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined;
const USER_POOL_CLIENT_ID = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID as string | undefined;
const USER_POOL_REGION =
  (import.meta.env.VITE_COGNITO_REGION as string | undefined) || USER_POOL_ID?.split('_')[0] || undefined;
const EXPECTED_ISSUER = USER_POOL_REGION && USER_POOL_ID ? `https://cognito-idp.${USER_POOL_REGION}.amazonaws.com/${USER_POOL_ID}` : '';
const AUTH_CONFIG_SIGNATURE = [
  import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  import.meta.env.VITE_COGNITO_REGION || '',
  import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || '',
  BACKEND_TOKEN_USE
].join('|');

const TOKEN_VALIDATION_CONFIG = {
  userPoolClientId: USER_POOL_CLIENT_ID,
  expectedIssuer: EXPECTED_ISSUER
};

export function AuthProvider({ children }: PropsWithChildren) {
  const bootstrappedSession = useMemo(
    () => bootstrapAuthSession({
      authConfigSignature: AUTH_CONFIG_SIGNATURE,
      backendTokenUse: BACKEND_TOKEN_USE,
      tokenValidationConfig: TOKEN_VALIDATION_CONFIG
    }),
    []
  );

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
    const idClaimsValid = isTokenClaimsValid(idToken, 'id', TOKEN_VALIDATION_CONFIG);
    const accessClaimsValid = isTokenClaimsValid(accessToken, 'access', TOKEN_VALIDATION_CONFIG);

    if (!idToken || !accessToken || !idClaimsValid || !accessClaimsValid) {
      setToken(null);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      if (idToken || accessToken) {
        setIdToken(null);
        setAccessToken(null);
      }
      return;
    }

    const resolvedToken = resolveBackendToken(idToken, accessToken, BACKEND_TOKEN_USE);
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
    clearAuthSessionStorage();
    setIsExpiryWarningOpen(false);
    setSecondsToExpiry(0);
  }, []);

  const updateSession = useCallback(
    (nextSession: { idToken: string; accessToken: string; refreshToken?: string | null }, nextUser?: AuthUser | null) => {
      if (
        !isTokenClaimsValid(nextSession.idToken, 'id', TOKEN_VALIDATION_CONFIG)
        || !isTokenClaimsValid(nextSession.accessToken, 'access', TOKEN_VALIDATION_CONFIG)
      ) {
        clearLocalAuthState();
        throw new Error('Received invalid authentication token claims. Please sign in again.');
      }

      setIdToken(nextSession.idToken);
      setAccessToken(nextSession.accessToken);
      setRefreshToken(nextSession.refreshToken ?? refreshToken);

      persistTokens({
        idToken: nextSession.idToken,
        accessToken: nextSession.accessToken,
        refreshToken: nextSession.refreshToken ?? refreshToken,
        backendTokenUse: BACKEND_TOKEN_USE
      });

      if (nextUser) {
        setUser(nextUser);
        persistUser(nextUser);
      }
    },
    [refreshToken, clearLocalAuthState]
  );

  useSessionExpiryTimers({
    accessToken,
    warningWindowMs: EXPIRY_WARNING_WINDOW_MS,
    onWarningOpen: () => {
      setIsExpiryWarningOpen(true);
    },
    onExpired: clearLocalAuthState,
    onCountdownChange: setSecondsToExpiry
  });

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
