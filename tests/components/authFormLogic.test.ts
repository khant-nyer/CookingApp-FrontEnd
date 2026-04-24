import { describe, expect, it, vi } from 'vitest';
import {
  createSubmitHandlers,
  modeErrorContext,
  modeHeading,
  modeSubmitLabel
} from '../../src/components/authFormLogic';
import type { AuthFormActions, AuthFormState } from '../../src/components/authFormLogic';

function createForm(overrides: Partial<AuthFormState> = {}): AuthFormState {
  return {
    userName: 'chef',
    profileImageUrl: '',
    email: 'chef@example.com',
    password: 'secret123',
    code: '123456',
    newPassword: 'new-secret',
    ...overrides
  };
}

function createActions(): AuthFormActions {
  return {
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    verifyEmail: vi.fn().mockResolvedValue(undefined),
    forgotPassword: vi.fn().mockResolvedValue(undefined),
    confirmForgotPassword: vi.fn().mockResolvedValue(undefined)
  };
}

describe('authFormLogic', () => {
  it('exposes stable heading/submit/error mappings for all modes', () => {
    expect(modeHeading.login).toBe('Login');
    expect(modeSubmitLabel['forgot-password']).toBe('Send code');
    expect(modeErrorContext['reset-password']).toBe('reset-password');
  });

  it('register handler sets success and advances to verify-email', async () => {
    const actions = createActions();
    const setSuccess = vi.fn();
    const setMode = vi.fn();
    const setForm = vi.fn();

    const handlers = createSubmitHandlers({
      form: createForm({ profileImageUrl: 'https://example.com/avatar.png' }),
      actions,
      setSuccess,
      setMode,
      setForm
    });

    await handlers.register();

    expect(actions.register).toHaveBeenCalledWith('chef', 'chef@example.com', 'secret123', 'https://example.com/avatar.png');
    expect(setSuccess).toHaveBeenCalledWith('Registration successful. Please verify your email with the code sent by Cognito.');
    expect(setMode).toHaveBeenCalledWith('verify-email');
    expect(setForm).not.toHaveBeenCalled();
  });

  it('forgot-password handler sets success and advances to reset-password', async () => {
    const actions = createActions();
    const setSuccess = vi.fn();
    const setMode = vi.fn();
    const setForm = vi.fn();

    const handlers = createSubmitHandlers({
      form: createForm(),
      actions,
      setSuccess,
      setMode,
      setForm
    });

    await handlers['forgot-password']();

    expect(actions.forgotPassword).toHaveBeenCalledWith('chef@example.com');
    expect(setSuccess).toHaveBeenCalledWith('Verification code sent. Check your email.');
    expect(setMode).toHaveBeenCalledWith('reset-password');
  });

  it('verify-email handler submits email and code only', async () => {
    const actions = createActions();
    const setSuccess = vi.fn();
    const setMode = vi.fn();
    const setForm = vi.fn();

    const handlers = createSubmitHandlers({
      form: createForm(),
      actions,
      setSuccess,
      setMode,
      setForm
    });

    await handlers['verify-email']();

    expect(actions.verifyEmail).toHaveBeenCalledWith('chef@example.com', '123456');
  });

  it('reset-password handler clears sensitive fields and returns to login', async () => {
    const actions = createActions();
    const setSuccess = vi.fn();
    const setMode = vi.fn();
    const setForm = vi.fn();

    const handlers = createSubmitHandlers({
      form: createForm(),
      actions,
      setSuccess,
      setMode,
      setForm
    });

    await handlers['reset-password']();

    expect(actions.confirmForgotPassword).toHaveBeenCalledWith('chef@example.com', '123456', 'new-secret');
    expect(setSuccess).toHaveBeenCalledWith('Password reset successful. Please login.');
    expect(setMode).toHaveBeenCalledWith('login');

    const updater = setForm.mock.calls[0]?.[0] as (prev: AuthFormState) => AuthFormState;
    expect(
      updater({
        userName: 'chef',
        profileImageUrl: 'https://example.com/avatar.png',
        email: 'chef@example.com',
        password: 'old',
        code: '111111',
        newPassword: 'next'
      })
    ).toEqual({
      userName: 'chef',
      profileImageUrl: 'https://example.com/avatar.png',
      email: 'chef@example.com',
      password: '',
      code: '',
      newPassword: ''
    });
  });
});
