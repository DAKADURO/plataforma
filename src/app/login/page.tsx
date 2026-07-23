'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      setLoading(false);
      return;
    }

    router.push('/proyectos');
    router.refresh();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 shadow-[var(--shadow-md)]"
            style={{ background: 'var(--accent)' }}
          >
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Memrit Sears
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Acceso restringido a personal autorizado
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-[var(--shadow-lg)] border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Iniciar Sesión
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div
                className="text-sm px-4 py-3 rounded-xl border"
                style={{
                  background: 'var(--danger-bg)',
                  borderColor: 'var(--danger)',
                  color: 'var(--danger)',
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--border-focus)] border transition-all"
                style={{
                  background: 'var(--bg-surface-alt)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-[var(--border-focus)] border transition-all"
                  style={{
                    background: 'var(--bg-surface-alt)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl transition-all text-sm text-white mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Ingresar al Sistema
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center border-t pt-6" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ¿No tienes cuenta?{' '}
            <Link
              href="/registro"
              className="font-semibold transition-colors"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent)')}
            >
              Solicita acceso
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Memrit Sears · Acceso protegido
        </p>
      </div>
    </div>
  );
}
