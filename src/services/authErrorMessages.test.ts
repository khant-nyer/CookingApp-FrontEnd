import { describe, expect, it } from 'vitest';
import { CognitoServiceError } from './cognitoAuth';
import { getFriendlyAuthErrorMessage, isUnrecoverableSessionExtensionError } from './authErrorMessages';

describe('auth error mapping', () => {
  it('maps Cognito error codes to friendly messages', () => {
    const error = new CognitoServiceError('CodeMismatchException', 'Code mismatch');
    expect(getFriendlyAuthErrorMessage(error, 'verify-email')).toBe(
      'The verification code is invalid. Please check the code and try again.'
    );
  });

  it('maps network failures to actionable text', () => {
    const error = new Error('Failed to fetch');
    expect(getFriendlyAuthErrorMessage(error, 'login')).toBe('Network issue detected. Check your connection and try again.');
  });

  it('flags unrecoverable extend-session errors', () => {
    expect(isUnrecoverableSessionExtensionError(new CognitoServiceError('NotAuthorizedException', 'nope'))).toBe(true);
    expect(isUnrecoverableSessionExtensionError(new CognitoServiceError('TooManyRequestsException', 'slow down'))).toBe(false);
  });
});
