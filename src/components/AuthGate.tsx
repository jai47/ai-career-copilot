import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, User } from 'lucide-react';
import { login, register } from '../api/auth';
import { getHealth } from '../api/health';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { ApiError, formatApiError } from '../api/client';

export default function AuthGate() {
  const { login: saveAuth } = useAuth();
  const [mode, setMode] = useState<'loading' | 'login' | 'register'>('loading');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: health } = useAsync((signal) => getHealth(signal), [], true);

  if (mode === 'loading') {
    queueMicrotask(() => setMode('login'));
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await register({ name, email, password });
      saveAuth(response);
    } catch (err) {
      setError(formatApiError(err, 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await login({ email, password });
      saveAuth(response);
    } catch (err) {
      setError(formatApiError(err, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-muted text-[15px]">
        Loading…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 py-16"
    >
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <p className="text-[12px] font-medium tracking-[0.08em] uppercase text-muted mb-4">
            Career Copilot
          </p>
          <h1 className="text-[40px] sm:text-[44px] font-semibold tracking-[-0.035em] leading-[1.05] text-ink">
            {mode === 'register' ? 'Create your account.' : 'Sign in.'}
          </h1>
          <p className="mt-3 text-[17px] text-muted tracking-[-0.01em]">
            Your job search, quietly organized.
          </p>
          {health && (
            <p
              className={`mt-4 text-[13px] ${
                health.status === 'ok' ? 'text-muted' : 'text-amber-700'
              }`}
            >
              {health.status === 'ok' ? 'Connected' : `Backend: ${health.db}`}
            </p>
          )}
        </div>

        <div className="bg-surface border border-line rounded-[20px] p-8 sm:p-9">
          {error && (
            <div className="mb-5 bg-[#fff2f2] border border-[#f5c2c2] text-[#b00020] text-[14px] px-4 py-3 rounded-[12px] text-center">
              {error}
            </div>
          )}

          {mode === 'register' ? (
            <form className="space-y-4" onSubmit={handleRegister}>
              <Field label="Name" icon={User} value={name} onChange={setName} required />
              <Field label="Email" icon={Mail} value={email} onChange={setEmail} type="email" required />
              <Field label="Password" icon={Lock} value={password} onChange={setPassword} type="password" required />
              <Field
                label="Confirm password"
                icon={Lock}
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                required
              />
              <SubmitButton loading={submitting} label="Continue" />
              <ToggleLink
                text="Already have an account?"
                action="Sign in"
                onClick={() => {
                  setError('');
                  setMode('login');
                }}
              />
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleLogin}>
              <Field label="Email" icon={Mail} value={email} onChange={setEmail} type="email" required />
              <Field label="Password" icon={Lock} value={password} onChange={setPassword} type="password" required />
              <SubmitButton loading={submitting} label="Continue" />
              <ToggleLink
                text="New here?"
                action="Create an account"
                onClick={() => {
                  setError('');
                  setMode('register');
                }}
              />
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-muted block px-0.5">{label}</label>
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <Icon className="h-4 w-4 text-[#aeaeb2]" strokeWidth={1.75} />
        </div>
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-[12px] bg-soft border border-line focus:border-accent py-3 pl-10 pr-3 text-[15px] text-ink outline-none"
        />
      </div>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full mt-2 rounded-full bg-accent hover:bg-accent-hover disabled:opacity-50 py-3 px-4 text-[15px] font-medium text-white transition-colors cursor-pointer"
    >
      {loading ? 'Please wait…' : label}
    </button>
  );
}

function ToggleLink({
  text,
  action,
  onClick,
}: {
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <p className="pt-3 text-center text-[14px] text-muted">
      {text}{' '}
      <button
        type="button"
        onClick={onClick}
        className="text-accent font-medium hover:underline underline-offset-2 cursor-pointer"
      >
        {action}
      </button>
    </p>
  );
}
