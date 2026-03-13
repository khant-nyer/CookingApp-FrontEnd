import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../context/useAuth';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface AuthFormState {
  userName: string;
  profileImageUrl: string;
  email: string;
  password: string;
  code: string;
  newPassword: string;
}

export default function AuthForm() {
  const { login, register, forgotPassword, confirmForgotPassword } = useAuth();
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else if (mode === 'register') {
        await register(form.userName, form.email, form.password, form.profileImageUrl || undefined);
      } else if (mode === 'forgot-password') {
        await forgotPassword(form.email);
        setSuccess('Verification code sent. Check your email.');
        setMode('reset-password');
      } else {
        await confirmForgotPassword(form.email, form.code, form.newPassword);
        setSuccess('Password reset successful. Please login.');
        setMode('login');
        setForm((prev) => ({ ...prev, password: '', newPassword: '', code: '' }));
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>
        {mode === 'login'
          ? 'Login'
          : mode === 'register'
            ? 'Create account'
            : mode === 'forgot-password'
              ? 'Forgot password'
              : 'Reset password'}
      </h2>
      <form onSubmit={onSubmit} className="form">
        {mode === 'register' && (
          <label>
            Username
            <input name="userName" value={form.userName} onChange={onChange} required />
          </label>
        )}

        <label>
          Email
          <input name="email" value={form.email} onChange={onChange} type="email" required />
        </label>


        {mode === 'register' && (
          <label>
            Profile image URL
            <input
              name="profileImageUrl"
              value={form.profileImageUrl}
              onChange={onChange}
              type="url"
              placeholder="https://example.com/avatar.png"
            />
          </label>
        )}

        {(mode === 'login' || mode === 'register') && (
          <label>
            Password
            <input
              name="password"
              value={form.password}
              onChange={onChange}
              type="password"
              minLength={6}
              required
            />
          </label>
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
          {loading
            ? 'Please wait…'
            : mode === 'login'
              ? 'Login'
              : mode === 'register'
                ? 'Register'
                : mode === 'forgot-password'
                  ? 'Send code'
                  : 'Reset password'}
        </button>
      </form>

      {(mode === 'login' || mode === 'register') && (
        <>
          <button
            type="button"
            className="link-btn"
            onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
          {mode === 'login' && (
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
