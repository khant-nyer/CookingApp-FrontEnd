import { CognitoServiceError } from './cognitoAuth';

type AuthFlow =
  | 'login'
  | 'register'
  | 'verify-email'
  | 'resend-verification'
  | 'forgot-password'
  | 'reset-password'
  | 'extend-session';

const DEFAULT_MESSAGES: Record<AuthFlow, string> = {
  login: 'Unable to sign in right now. Please try again.',
  register: 'Unable to create your account right now. Please try again.',
  'verify-email': 'Unable to verify your email code. Please try again.',
  'resend-verification': 'Unable to resend the verification code. Please try again.',
  'forgot-password': 'Unable to send reset code. Please try again.',
  'reset-password': 'Unable to reset password. Please try again.',
  'extend-session': 'Unable to extend your session right now. Please try again.'
};

const COGNITO_CODE_MESSAGES: Record<string, string> = {
  UserNotConfirmedException: 'Your account is not verified yet. Please verify your email first.',
  CodeMismatchException: 'The verification code is invalid. Please check the code and try again.',
  ExpiredCodeException: 'The verification code has expired. Please request a new code.',
  TooManyFailedAttemptsException: 'Too many failed attempts. Please wait a few minutes and try again.',
  TooManyRequestsException: 'Too many requests right now. Please wait and try again.',
  InvalidPasswordException: 'Your password does not meet policy requirements. Please use a stronger password.',
  NotAuthorizedException: 'Your credentials are invalid or your session is no longer valid. Please sign in again.',
  NetworkError: 'Network issue detected. Check your connection and try again.',
  TimeoutError: 'Request timed out. Please try again.'
};

export function getFriendlyAuthErrorMessage(error: unknown, flow: AuthFlow): string {
  if (error instanceof CognitoServiceError) {
    return COGNITO_CODE_MESSAGES[error.code] || error.message || DEFAULT_MESSAGES[flow];
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('failed to fetch')) {
      return COGNITO_CODE_MESSAGES.NetworkError;
    }

    return DEFAULT_MESSAGES[flow];
  }

  return DEFAULT_MESSAGES[flow];
}

export function isUnrecoverableSessionExtensionError(error: unknown) {
  if (error instanceof CognitoServiceError) {
    return ['NotAuthorizedException', 'UserNotFoundException', 'InvalidParameterException'].includes(error.code);
  }

  return false;
}
