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
    const { error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      // Optional: If you have email confirmations enabled in Supabase, 
      // you might need to handle the verification flow.
    });

    if (authError) {
      setError(authError.message || 'Ocurrió un error al registrar el usuario.');
      setLoading(false);
      return;
    }

    // Sync to Prisma with PENDIENTE role
    await registerUserInDb(email);

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 mb-4 shadow-lg border border-slate-700">
            <Shield className="w-9 h-9 text-slate-300" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Solicitar Acceso</h1>
          <p className="text-slate-400 mt-2 text-base">Crea tu cuenta para acceder a la plataforma</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Solicitud Enviada</h2>
              <p className="text-slate-400 text-sm">
                Tu cuenta ha sido creada exitosamente. Un administrador debe aprobar tu acceso y asignarte un rol antes de que puedas entrar al sistema.
              </p>
              <Link href="/login" className="mt-6 inline-block w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm border border-slate-700">
                Volver al Inicio de Sesión
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleRegister} className="space-y-5">
                {error && (
                  <div className="bg-rose-950/60 border border-rose-500/30 text-rose-300 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Correo Electrónico Empresarial
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="w-full bg-slate-800/80 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
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
                      className="w-full bg-slate-800/80 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-white text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg text-sm mt-4"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
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

              <div className="mt-6 text-center border-t border-slate-800 pt-6">
                <p className="text-sm text-slate-400">
                  ¿Ya tienes una cuenta?{' '}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                    Inicia Sesión aquí
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} Sistema de Gestión Empresarial
        </p>
      </div>
    </div>
  );
}
