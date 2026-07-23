/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus, Shield } from 'lucide-react';
import Link from 'next/link';
import { registerUserInDb } from '@/app/actions/users';

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message || 'Ocurrió un error al registrar el usuario.');
      setLoading(false);
      return;
    }

    await registerUserInDb(email);
    setSuccess(true);
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-surface-alt)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.15s',
  } as const;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 border"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <Shield className="w-9 h-9" style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Solicitar Acceso
          </h1>
          <p className="mt-2 text-base" style={{ color: 'var(--text-muted)' }}>
            Crea tu cuenta para acceder a la plataforma
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          {success ? (
            <div className="text-center space-y-4 animate-fade-in">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
              >
                <UserPlus className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Solicitud Enviada
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Tu cuenta ha sido creada exitosamente. Un administrador debe aprobar tu acceso y asignarte un rol antes de que puedas entrar al sistema.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block w-full font-semibold py-3 px-4 rounded-xl transition-all text-sm text-center border"
                style={{
                  background: 'var(--bg-surface-alt)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                Volver al Inicio de Sesión
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleRegister} className="space-y-5">
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
                    Correo Electrónico Empresarial
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Contraseña (mínimo 6 caracteres)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: '3rem' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
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
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-all duration-200 text-sm mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: '#ffffff' }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Registrar Cuenta
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center border-t pt-6" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    href="/login"
                    className="font-semibold transition-colors"
                    style={{ color: 'var(--accent)' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    Inicia Sesión aquí
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          © {new Date().getFullYear()} Sistema de Gestión Empresarial
        </p>
      </div>
    </div>
  );
}
