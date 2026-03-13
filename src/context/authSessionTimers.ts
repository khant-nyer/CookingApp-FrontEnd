export interface SessionTiming {
  warningDelayMs: number;
  expiryDelayMs: number;
}

export function calculateSessionTiming(expiryTimeMs: number, nowMs: number, warningWindowMs: number): SessionTiming | null {
  const expiryDelayMs = expiryTimeMs - nowMs;
  if (expiryDelayMs <= 0) return null;

  return {
    warningDelayMs: Math.max(0, expiryDelayMs - warningWindowMs),
    expiryDelayMs
  };
}

export function calculateSecondsToExpiry(expiryTimeMs: number, nowMs: number) {
  return Math.max(0, Math.ceil((expiryTimeMs - nowMs) / 1000));
}
