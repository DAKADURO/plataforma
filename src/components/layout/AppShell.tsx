'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type UserInfo = {
  email: string;
  role: string;
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN:    { label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
  GERENTE:  { label: 'Gerente',       color: 'bg-blue-100 text-blue-700' },
  TECNICO:  { label: 'Técnico',       color: 'bg-slate-100 text-slate-600' },
};

const NAV_LINKS = [
  { href: '/almacen',  label: 'Almacén' },
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/visor',    label: 'Centro de Comando' },
];

export default function AppShell({ children, user }: { children: React.ReactNode; user: UserInfo }) {
  const router = useRouter();
  const roleInfo = ROLE_LABELS[user.role] ?? ROLE_LABELS['TECNICO'];

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TOP NAVBAR */}
      <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg shadow-slate-900/30">
        <div className="flex items-center gap-8">
          <Link href="/almacen" className="text-lg font-extrabold text-white tracking-tight hover:text-blue-400 transition-colors">
            ⚙ Plataforma Empresarial
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              >
                {link.label}
                <ChevronRight className="w-3 h-3 opacity-50" />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-white leading-none">{user.email}</p>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Salir</span>
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
