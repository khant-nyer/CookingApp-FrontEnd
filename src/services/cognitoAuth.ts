const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined;
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID as string | undefined;
const explicitRegion = import.meta.env.VITE_COGNITO_REGION as string | undefined;

function deriveRegion() {
  if (explicitRegion) return explicitRegion;
  if (!userPoolId) return '';
  const [region] = userPoolId.split('_');
  return region || '';
}

const region = deriveRegion();

export class CognitoServiceError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'CognitoServiceError';
  }
}

function assertCognitoConfigured() {
  if (!region || !userPoolClientId || !userPoolId) {
    throw new Error(
      'Cognito is not configured. Set VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_REGION (optional if derivable), and VITE_COGNITO_USER_POOL_CLIENT_ID.'
    );
  }
}

function cognitoEndpoint() {
  return `https://cognito-idp.${region}.amazonaws.com/`;
}

async function cognitoRequest<T>(target: string, body: Record<string, unknown>) {
  assertCognitoConfigured();

  let response: Response;
  try {
    response = await fetch(cognitoEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new CognitoServiceError('NetworkError', error.message || 'Network error while contacting Cognito.');
    }
    throw new CognitoServiceError('NetworkError', 'Network error while contacting Cognito.');
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const rawType = (data.__type || data.name || '') as string;
    const code = rawType.includes('#') ? rawType.split('#')[1] : rawType || 'CognitoError';
    const message = (data.message || data.Message || 'Cognito request failed.') as string;
    throw new CognitoServiceError(code, message);
  }

  return data as T;
}

export function isExpiredSessionError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('access token has expired') || message.includes('token has expired');
}

function parseJwtPayload(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(json) as Record<string, string>;
  } catch {
    return null;
  }
}

export interface CognitoAuthResult {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  email?: string;
  userId?: string;
}

export async function loginWithCognito(email: string, password: string): Promise<CognitoAuthResult> {
  const data = await cognitoRequest<{
    AuthenticationResult?: { AccessToken?: string; IdToken?: string; RefreshToken?: string };
    ChallengeName?: string;
  }>('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: userPoolClientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  });

  if (data.ChallengeName) {
    throw new Error(`Unsupported Cognito sign-in challenge: ${data.ChallengeName}`);
  }

  const accessToken = data.AuthenticationResult?.AccessToken;
  const idToken = data.AuthenticationResult?.IdToken;
  const refreshToken = data.AuthenticationResult?.RefreshToken;

  if (!accessToken || !idToken) {
    throw new Error('Cognito login succeeded but access/id token was not returned.');
  }

  const payload = parseJwtPayload(idToken);

  return {
    accessToken,
    idToken,
    refreshToken,
    email: payload?.email || email,
    userId: payload?.sub
  };
}

export interface CognitoRefreshResult {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
}

export async function refreshSessionWithCognito(refreshToken: string): Promise<CognitoRefreshResult> {
  const data = await cognitoRequest<{
    AuthenticationResult?: { AccessToken?: string; IdToken?: string; RefreshToken?: string };
  }>('InitiateAuth', {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: userPoolClientId,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken
    }
  });

  const accessToken = data.AuthenticationResult?.AccessToken;
  const idToken = data.AuthenticationResult?.IdToken;

  if (!accessToken || !idToken) {
    throw new Error('Cognito refresh succeeded but access/id token was not returned.');
  }

  return {
    accessToken,
    idToken,
    refreshToken: data.AuthenticationResult?.RefreshToken
  };
}

export async function logoutFromCognito(accessToken: string | null) {
  if (!accessToken) return;
  await cognitoRequest('GlobalSignOut', { AccessToken: accessToken });
}

export async function startForgotPassword(email: string) {
  await cognitoRequest('ForgotPassword', {
    ClientId: userPoolClientId,
    Username: email
  });
}

export async function confirmForgotPassword(email: string, confirmationCode: string, newPassword: string) {
  await cognitoRequest('ConfirmForgotPassword', {
    ClientId: userPoolClientId,
    Username: email,
    ConfirmationCode: confirmationCode,
    Password: newPassword
  });
}

export async function confirmEmailVerification(email: string, confirmationCode: string) {
  await cognitoRequest('ConfirmSignUp', {
    ClientId: userPoolClientId,
    Username: email,
    ConfirmationCode: confirmationCode
  });
}

export async function resendEmailVerificationCode(email: string) {
  await cognitoRequest('ResendConfirmationCode', {
    ClientId: userPoolClientId,
    Username: email
  });
}
