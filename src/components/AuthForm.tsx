import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { getFriendlyAuthErrorMessage } from '../services/authErrorMessages';
import { useAuth } from '../context/useAuth';

type AuthMode = 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password';

interface AuthFormState {
  userName: string;
  profileImageUrl: string;
  email: string;
  password: string;
  code: string;
  newPassword: string;
}

const modeHeading: Record<AuthMode, string> = {
  login: 'Login',
  register: 'Create account',
  'verify-email': 'Verify email',
  'forgot-password': 'Forgot password',
  'reset-password': 'Reset password'
};

const modeSubmitLabel: Record<AuthMode, string> = {
  login: 'Login',
  register: 'Register',
  'verify-email': 'Verify email',
  'forgot-password': 'Send code',
  'reset-password': 'Reset password'
};

const modeErrorContext: Record<AuthMode, 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password'> = {
  login: 'login',
  register: 'register',
  'verify-email': 'verify-email',
  'forgot-password': 'forgot-password',
  'reset-password': 'reset-password'
};

export default function AuthForm() {
  const { login, register, verifyEmail, resendVerificationCode, forgotPassword, confirmForgotPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState<AuthFormState>({
    userName: '',
    email: '',
    password: '',
    profileImageUrl: '',
    code: '',
    newPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const submitHandlers = useMemo(() => ({
    login: async () => {
      await login(form.email, form.password);
    },
    register: async () => {
      await register(form.userName, form.email, form.password, form.profileImageUrl || undefined);
      setSuccess('Registration successful. Please verify your email with the code sent by Cognito.');
      setMode('verify-email');
    },
    'verify-email': async () => {
      await verifyEmail(form.email, form.code, form.password);
    },
    'forgot-password': async () => {
      await forgotPassword(form.email);
      setSuccess('Verification code sent. Check your email.');
      setMode('reset-password');
    },
    'reset-password': async () => {
      await confirmForgotPassword(form.email, form.code, form.newPassword);
      setSuccess('Password reset successful. Please login.');
      setMode('login');
      setForm((prev) => ({ ...prev, password: '', newPassword: '', code: '' }));
    }
  }), [confirmForgotPassword, forgotPassword, form.code, form.email, form.newPassword, form.password, form.profileImageUrl, form.userName, login, register, verifyEmail]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await submitHandlers[mode]();
    } catch (submitError) {
      console.error('Auth form submission failed', submitError);
      setError(getFriendlyAuthErrorMessage(submitError, modeErrorContext[mode]));
    } finally {
      setLoading(false);
    }
  }

  async function onResendVerificationCode() {
    setError('');
    setSuccess('');

    try {
      await resendVerificationCode(form.email);
      setSuccess('A new verification code has been sent.');
    } catch (resendError) {
      console.error('Resend verification failed', resendError);
      setError(getFriendlyAuthErrorMessage(resendError, 'resend-verification'));
    }
  }

  return (
    <section className="card">
      <h2>{modeHeading[mode]}</h2>
      <form onSubmit={onSubmit} className="form">
        {(mode === 'register' || mode === 'verify-email') && (
          <label>
            Username
            <input name="userName" value={form.userName} onChange={onChange} required={mode === 'register'} disabled={mode === 'verify-email'} />
          </label>
        )}

        <label>
          Email
          <input name="email" value={form.email} onChange={onChange} type="email" required disabled={mode === 'verify-email'} />
        </label>

        {(mode === 'register' || mode === 'verify-email') && (
          <label>
            Profile image URL
            <input
              name="profileImageUrl"
              value={form.profileImageUrl}
              onChange={onChange}
              type="url"
              disabled={mode === 'verify-email'}
              placeholder="https://example.com/avatar.png"
            />
          </label>
        )}

        {(mode === 'login' || mode === 'register' || mode === 'verify-email') && (
          <label>
            Password
            <input
              name="password"
              value={form.password}
              onChange={onChange}
              type="password"
              minLength={6}
              required
              disabled={mode === 'verify-email'}
            />
          </label>
        )}

        {mode === 'verify-email' && (
          <>
            <label>
              Verification code
              <input name="code" value={form.code} onChange={onChange} required />
            </label>
            <button type="button" className="link-btn" onClick={() => void onResendVerificationCode()}>
              Resend verification code
            </button>
          </>
        )}

        {mode === 'reset-password' && (
          <>
            <label>
              Verification code
              <input name="code" value={form.code} onChange={onChange} required />
            </label>
            <label>
              New password
              <input
                name="newPassword"
                value={form.newPassword}
                onChange={onChange}
                type="password"
                minLength={6}
                required
              />
            </label>
          </>
        )}

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait…' : modeSubmitLabel[mode]}
        </button>
      </form>

      {(mode === 'login' || mode === 'register' || mode === 'verify-email') && (
        <>
          <button
            type="button"
            className="link-btn"
            onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
          {(mode === 'login' || mode === 'verify-email') && (
            <button type="button" className="link-btn" onClick={() => setMode('forgot-password')}>
              Forgot password?
            </button>
          )}
        </>
      )}

      {(mode === 'forgot-password' || mode === 'reset-password') && (
        <button type="button" className="link-btn" onClick={() => setMode('login')}>
          Back to login
        </button>
      )}
    </section>
  );
}
