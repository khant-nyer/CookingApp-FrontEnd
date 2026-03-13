import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSessionTimerHandles, scheduleSessionExpiryTimers, type SessionTimerHandles } from './useSessionExpiryTimers';

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createJwt(payload: Record<string, unknown>) {
  return `header.${base64UrlEncode(JSON.stringify(payload))}.signature`;
}

describe('useSessionExpiryTimers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true });
  });

  it('schedules warning and expiry callbacks', () => {
    const onWarningOpen = vi.fn();
    const onExpired = vi.fn();
    const onCountdownChange = vi.fn();

    const nowMs = Date.now();
    const exp = Math.floor((nowMs + 10_000) / 1000);
    const accessToken = createJwt({ exp });

    const handles: SessionTimerHandles = { warningTimeoutId: null, expiryTimeoutId: null, countdownIntervalId: null };

    scheduleSessionExpiryTimers(
      {
        accessToken,
        warningWindowMs: 5_000,
        nowMs,
        onWarningOpen,
        onExpired,
        onCountdownChange
      },
      handles
    );

    vi.advanceTimersByTime(5_000);
    expect(onWarningOpen).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5_000);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('clears timeout and interval handles on cleanup', () => {
    const handles: SessionTimerHandles = {
      warningTimeoutId: window.setTimeout(() => {}, 5_000),
      expiryTimeoutId: window.setTimeout(() => {}, 5_000),
      countdownIntervalId: window.setInterval(() => {}, 1_000)
    };

    clearSessionTimerHandles(handles);

    expect(handles.warningTimeoutId).toBeNull();
    expect(handles.expiryTimeoutId).toBeNull();
    expect(handles.countdownIntervalId).toBeNull();
  });

  it('countdown never goes below zero', () => {
    const onCountdownChange = vi.fn();
    const nowMs = Date.now();
    const exp = Math.floor((nowMs + 2_000) / 1000);
    const accessToken = createJwt({ exp });

    const handles: SessionTimerHandles = { warningTimeoutId: null, expiryTimeoutId: null, countdownIntervalId: null };

    scheduleSessionExpiryTimers(
      {
        accessToken,
        warningWindowMs: 5_000,
        nowMs,
        onWarningOpen: vi.fn(),
        onExpired: vi.fn(),
        onCountdownChange
      },
      handles
    );

    vi.advanceTimersByTime(10_000);

    const countdownValues = onCountdownChange.mock.calls.map((call) => call[0] as number);
    expect(Math.min(...countdownValues)).toBe(0);
  });
});
