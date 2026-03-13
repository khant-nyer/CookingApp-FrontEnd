import { describe, expect, it, vi } from 'vitest';
import { executeExtendSession } from './extendSessionFlow';

describe('executeExtendSession', () => {
  it('updates tokens and calls onExtended on success', async () => {
    const refreshSession = vi.fn().mockResolvedValue({
      idToken: 'new-id',
      accessToken: 'new-access',
      refreshToken: 'new-refresh'
    });
    const updateSession = vi.fn();
    const onExtended = vi.fn();

    await executeExtendSession({
      refreshToken: 'existing-refresh',
      refreshSession,
      updateSession,
      onExtended,
      clearLocalAuthState: vi.fn(),
      toFriendlyMessage: () => 'friendly',
      isUnrecoverableError: () => false
    });

    expect(updateSession).toHaveBeenCalledWith({
      idToken: 'new-id',
      accessToken: 'new-access',
      refreshToken: 'new-refresh'
    });
    expect(onExtended).toHaveBeenCalledTimes(1);
  });

  it('clears auth state and throws friendly error for unrecoverable failures', async () => {
    const clearLocalAuthState = vi.fn();

    await expect(
      executeExtendSession({
        refreshToken: 'existing-refresh',
        refreshSession: vi.fn().mockRejectedValue(new Error('NotAuthorizedException')),
        updateSession: vi.fn(),
        onExtended: vi.fn(),
        clearLocalAuthState,
        toFriendlyMessage: () => 'Please sign in again.',
        isUnrecoverableError: () => true
      })
    ).rejects.toThrow('Please sign in again.');

    expect(clearLocalAuthState).toHaveBeenCalledTimes(1);
  });
});
