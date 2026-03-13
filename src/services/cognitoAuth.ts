const DEFAULT_COGNITO_USER_POOL_ID = 'ap-southeast-2_rt542m5n0';
const DEFAULT_COGNITO_REGION = 'ap-southeast-2';
const DEFAULT_COGNITO_CLIENT_ID = '7frnm8fk0j7iv8mqg54fiqd9cp';

const userPoolId = (import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined) || DEFAULT_COGNITO_USER_POOL_ID;
const userPoolClientId = (import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID as string | undefined) || DEFAULT_COGNITO_CLIENT_ID;
const explicitRegion = (import.meta.env.VITE_COGNITO_REGION as string | undefined) || DEFAULT_COGNITO_REGION;

function deriveRegion() {
  if (explicitRegion) return explicitRegion;
  if (!userPoolId) return '';
  const [region] = userPoolId.split('_');
  return region || '';
}

const region = deriveRegion();

function assertCognitoConfigured() {
  if (!region || !userPoolClientId) {
    throw new Error(
      'Cognito is not configured. Set VITE_COGNITO_USER_POOL_ID or VITE_COGNITO_REGION and VITE_COGNITO_USER_POOL_CLIENT_ID.'
    );
  }
}

function cognitoEndpoint() {
  return `https://cognito-idp.${region}.amazonaws.com/`;
}

async function cognitoRequest<T>(target: string, body: Record<string, unknown>) {
  assertCognitoConfigured();

  const response = await fetch(cognitoEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.message || data?.Message || 'Cognito request failed.';
    throw new Error(message);
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
  email?: string;
  userId?: string;
}

export async function loginWithCognito(email: string, password: string): Promise<CognitoAuthResult> {
  const data = await cognitoRequest<{
    AuthenticationResult?: { AccessToken?: string; IdToken?: string };
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

  if (!accessToken || !idToken) {
    throw new Error('Cognito login succeeded but access/id token was not returned.');
  }

  const payload = parseJwtPayload(idToken);

  return {
    accessToken,
    idToken,
    email: payload?.email || email,
    userId: payload?.sub
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
