import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../context/useAuth';

type AuthMode = 'login' | 'register';

interface AuthFormState {
  name: string;
  email: string;
  password: string;
}

export default function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState<AuthFormState>({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>{mode === 'login' ? 'Login' : 'Create account'}</h2>
      <form onSubmit={onSubmit} className="form">
        {mode === 'register' && (
          <label>
            Name
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
        )}

        <label>
          Email
          <input name="email" value={form.email} onChange={onChange} type="email" required />
        </label>

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

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>

      <button
        type="button"
        className="link-btn"
        onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
      >
        {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </section>
  );
}
