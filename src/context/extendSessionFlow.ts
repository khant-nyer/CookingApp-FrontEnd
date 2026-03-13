export interface RefreshResult {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
}

interface ExecuteExtendSessionParams {
  refreshToken: string | null;
  refreshSession: (refreshToken: string) => Promise<RefreshResult>;
  updateSession: (session: { idToken: string; accessToken: string; refreshToken?: string | null }) => void;
  onExtended: () => void;
  clearLocalAuthState: () => void;
  toFriendlyMessage: (error: unknown) => string;
  isUnrecoverableError: (error: unknown) => boolean;
}

export async function executeExtendSession({
  refreshToken,
  refreshSession,
  updateSession,
  onExtended,
  clearLocalAuthState,
  toFriendlyMessage,
  isUnrecoverableError
}: ExecuteExtendSessionParams) {
  if (!refreshToken) {
    throw new Error(toFriendlyMessage(new Error('missing refresh token')));
  }

  try {
    const refreshedSession = await refreshSession(refreshToken);
    updateSession({
      idToken: refreshedSession.idToken,
      accessToken: refreshedSession.accessToken,
      refreshToken: refreshedSession.refreshToken ?? refreshToken
    });
    onExtended();
  } catch (error) {
    if (isUnrecoverableError(error)) {
      clearLocalAuthState();
    }

    throw new Error(toFriendlyMessage(error));
  }
}
