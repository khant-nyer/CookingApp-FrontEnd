import { describe, expect, it } from 'vitest';
import { formatExpiryCountdown } from '../../src/components/sessionExpiryUtils';

describe('SessionExpiryModal display helpers', () => {
  it('formats countdown as X:YY', () => {
    expect(formatExpiryCountdown(305)).toBe('5:05');
    expect(formatExpiryCountdown(59)).toBe('0:59');
  });

  it('clamps negative countdown values to zero', () => {
    expect(formatExpiryCountdown(-10)).toBe('0:00');
  });
});
