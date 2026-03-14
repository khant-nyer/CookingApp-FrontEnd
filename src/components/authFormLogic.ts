export type AuthMode = 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password';

export interface AuthFormState {
  userName: string;
  profileImageUrl: string;
  email: string;
  password: string;
  code: string;
  newPassword: string;
}

export interface AuthFormActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userName: string, email: string, password: string, profileImageUrl?: string) => Promise<void>;
  verifyEmail: (email: string, code: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

export const modeHeading: Record<AuthMode, string> = {
  login: 'Login',
  register: 'Create account',
  'verify-email': 'Verify email',
  'forgot-password': 'Forgot password',
  'reset-password': 'Reset password'
};

export const modeSubmitLabel: Record<AuthMode, string> = {
  login: 'Login',
  register: 'Register',
  'verify-email': 'Verify email',
  'forgot-password': 'Send code',
  'reset-password': 'Reset password'
};

export const modeErrorContext: Record<AuthMode, 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password'> = {
  login: 'login',
  register: 'register',
  'verify-email': 'verify-email',
  'forgot-password': 'forgot-password',
  'reset-password': 'reset-password'
};

export function createSubmitHandlers({
  form,
  actions,
  setSuccess,
  setMode,
  setForm
}: {
  form: AuthFormState;
  actions: AuthFormActions;
  setSuccess: (value: string) => void;
  setMode: (value: AuthMode) => void;
  setForm: (updater: (prev: AuthFormState) => AuthFormState) => void;
}) {
  return {
    login: async () => {
      await actions.login(form.email, form.password);
    },
    register: async () => {
      await actions.register(form.userName, form.email, form.password, form.profileImageUrl || undefined);
      setSuccess('Registration successful. Please verify your email with the code sent by Cognito.');
      setMode('verify-email');
    },
    'verify-email': async () => {
      await actions.verifyEmail(form.email, form.code, form.password);
    },
    'forgot-password': async () => {
      await actions.forgotPassword(form.email);
      setSuccess('Verification code sent. Check your email.');
      setMode('reset-password');
    },
    'reset-password': async () => {
      await actions.confirmForgotPassword(form.email, form.code, form.newPassword);
      setSuccess('Password reset successful. Please login.');
      setMode('login');
      setForm((prev) => ({ ...prev, password: '', newPassword: '', code: '' }));
    }
  };
}
