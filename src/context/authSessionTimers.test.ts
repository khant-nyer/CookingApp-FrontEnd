import { describe, expect, it } from 'vitest';
import { calculateSecondsToExpiry, calculateSessionTiming } from './authSessionTimers';

describe('authSessionTimers', () => {
  it('triggers warning at threshold and expiry at exp', () => {
    const nowMs = 1_000_000;
    const expiryTimeMs = nowMs + 10 * 60 * 1000;

    const timing = calculateSessionTiming(expiryTimeMs, nowMs, 5 * 60 * 1000);

    expect(timing).toEqual({
      warningDelayMs: 5 * 60 * 1000,
      expiryDelayMs: 10 * 60 * 1000
    });
  });

  it('returns null when already expired', () => {
    expect(calculateSessionTiming(1000, 1001, 100)).toBeNull();
  });

  it('supports timer reschedule after extend by recomputing against later exp', () => {
    const nowMs = 5_000;
    const initial = calculateSessionTiming(nowMs + 60_000, nowMs, 30_000);
    const extended = calculateSessionTiming(nowMs + 300_000, nowMs, 30_000);

    expect(initial).toEqual({ warningDelayMs: 30_000, expiryDelayMs: 60_000 });
    expect(extended).toEqual({ warningDelayMs: 270_000, expiryDelayMs: 300_000 });
  });

  it('calculates countdown seconds safely', () => {
    expect(calculateSecondsToExpiry(5000, 1000)).toBe(4);
    expect(calculateSecondsToExpiry(5000, 6000)).toBe(0);
  });
});
