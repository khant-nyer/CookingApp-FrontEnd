import { useEffect, useRef } from 'react';
import { calculateSecondsToExpiry, calculateSessionTiming } from './authSessionTimers';
import { parseTokenExpiry } from './useTokenClaims';

interface UseSessionExpiryTimersParams {
  accessToken: string | null;
  warningWindowMs: number;
  onWarningOpen: () => void;
  onExpired: () => void;
  onCountdownChange: (seconds: number) => void;
}

interface SessionTimerParams {
  accessToken: string | null;
  warningWindowMs: number;
  nowMs: number;
  onWarningOpen: () => void;
  onExpired: () => void;
  onCountdownChange: (seconds: number) => void;
}

export interface SessionTimerHandles {
  warningTimeoutId: number | null;
  expiryTimeoutId: number | null;
  countdownIntervalId: number | null;
}

export function clearSessionTimerHandles(handles: SessionTimerHandles) {
  if (handles.warningTimeoutId !== null) {
    window.clearTimeout(handles.warningTimeoutId);
    handles.warningTimeoutId = null;
  }

  if (handles.expiryTimeoutId !== null) {
    window.clearTimeout(handles.expiryTimeoutId);
    handles.expiryTimeoutId = null;
  }

  if (handles.countdownIntervalId !== null) {
    window.clearInterval(handles.countdownIntervalId);
    handles.countdownIntervalId = null;
  }
}

export function scheduleSessionExpiryTimers(params: SessionTimerParams, handles: SessionTimerHandles) {
  const { accessToken, warningWindowMs, nowMs, onWarningOpen, onExpired, onCountdownChange } = params;

  clearSessionTimerHandles(handles);
  onCountdownChange(0);

  const expiryTime = parseTokenExpiry(accessToken);
  if (!accessToken || !expiryTime) return;

  const timing = calculateSessionTiming(expiryTime, nowMs, warningWindowMs);
  if (!timing) {
    onExpired();
    return;
  }

  const startExpiryCountdown = () => {
    if (handles.countdownIntervalId !== null) {
      window.clearInterval(handles.countdownIntervalId);
      handles.countdownIntervalId = null;
    }

    const updateCountdown = () => {
      const secondsLeft = calculateSecondsToExpiry(expiryTime, Date.now());
      onCountdownChange(secondsLeft);

      if (secondsLeft <= 0 && handles.countdownIntervalId !== null) {
        window.clearInterval(handles.countdownIntervalId);
        handles.countdownIntervalId = null;
      }
    };

    updateCountdown();
    handles.countdownIntervalId = window.setInterval(updateCountdown, 1000);
  };

  handles.warningTimeoutId = window.setTimeout(() => {
    onWarningOpen();
    startExpiryCountdown();
  }, timing.warningDelayMs);

  handles.expiryTimeoutId = window.setTimeout(() => {
    onExpired();
  }, timing.expiryDelayMs);
}

export function useSessionExpiryTimers({
  accessToken,
  warningWindowMs,
  onWarningOpen,
  onExpired,
  onCountdownChange
}: UseSessionExpiryTimersParams) {
  const handlesRef = useRef<SessionTimerHandles>({
    warningTimeoutId: null,
    expiryTimeoutId: null,
    countdownIntervalId: null
  });

  useEffect(() => {
    const handles = handlesRef.current;

    scheduleSessionExpiryTimers(
      {
        accessToken,
        warningWindowMs,
        nowMs: Date.now(),
        onWarningOpen,
        onExpired,
        onCountdownChange
      },
      handles
    );

    return () => {
      clearSessionTimerHandles(handles);
    };
  }, [accessToken, warningWindowMs, onWarningOpen, onExpired, onCountdownChange]);
}
