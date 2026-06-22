'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase';

import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User, LayoutDashboard, Package, Folders, Search, Menu, Activity, X } from 'lucide-react';
import Link from 'next/link';
import Notifications from './Notifications';
import { useState } from 'react';

type UserInfo = {
  email: string;
  role: string;
};

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  ADMIN:   { label: 'Admin',    className: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  GERENTE: { label: 'Gerente',  className: 'bg-blue-50  dark:bg-blue-500/10  text-blue-600  dark:text-blue-400' },
  TECNICO: { label: 'Técnico',  className: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400' },
};

const NAV_LINKS = [
  { href: '/almacen',    label: 'Almacén',           icon: Package },
  { href: '/proyectos',  label: 'Proyectos',          icon: Folders },
  { href: '/visor',      label: 'Centro de Comando',  icon: LayoutDashboard },
  { href: '/analiticas', label: 'Analíticas',          icon: Activity },
];

export default function AppShell({ children, user }: { children: React.ReactNode; user: UserInfo }) {
  const router = useRouter();
  const pathname = usePathname();
  const roleInfo = ROLE_BADGES[user.role] ?? ROLE_BADGES['TECNICO'];
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const NavLinks = () => (
    <>
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
              ${active
                ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)] hover:text-[var(--text-primary)]'
              }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[var(--accent)]' : ''}`} />
            <span>{label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* ── TOPBAR ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 h-14"
        style={{
          background: 'var(--bg-overlay)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* LEFT: Logo + Nav */}
        <div className="flex items-center gap-1 sm:gap-6">
          <Link href="/almacen" className="flex items-center gap-2 mr-2 group shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent)' }}>
              <span className="text-white font-bold text-sm leading-none">M</span>
            </div>
            <span className="hidden sm:block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Menrit Sears
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLinks />
          </nav>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm cursor-text"
            style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-muted)' }}>
            <Search className="w-3.5 h-3.5" />
            <span>Buscar…</span>
            <kbd className="text-[10px] px-1 rounded" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>⌘K</kbd>
          </div>

          <Notifications />

          <div className="w-px h-5 hidden sm:block mx-1" style={{ background: 'var(--border)' }} />



          {/* User pill */}
          <div className="hidden sm:flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)' }}>
              <User className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="leading-none">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {user.email.split('@')[0]}
              </p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5 inline-block ${roleInfo.className}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── MOBILE NAV ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 py-3 flex flex-col gap-1 border-b animate-slide-down"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <NavLinks />
        </div>
      )}

      {/* ── MAIN ───────────────────────────────────────────────────── */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
