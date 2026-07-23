'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import {
  LogOut, User, LayoutDashboard, Package, Folders, Menu,
  Activity, X, Users, Shield, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import Notifications from './Notifications';
import GlobalSearch from './GlobalSearch';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import { useState, useEffect } from 'react';

type UserInfo = { email: string; role: string };

const ROLE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  ADMIN:   { label: 'Admin',   bg: 'var(--accent-subtle)',        color: 'var(--accent)' },
  GERENTE: { label: 'Gerente', bg: 'rgba(59,130,246,0.1)',         color: '#3b82f6' },
  TECNICO: { label: 'Técnico', bg: 'var(--bg-surface-alt)',        color: 'var(--text-muted)' },
};

const NAV_LINKS = [
  { href: '/almacen',    label: 'Almacén',         icon: Package },
  { href: '/maquinas',   label: 'Máquinas',        icon: Settings },
  { href: '/clientes',   label: 'Clientes',        icon: Users },
  { href: '/proyectos',  label: 'Proyectos',       icon: Folders },
  { href: '/visor',      label: 'Centro de Mando', icon: LayoutDashboard },
  { href: '/analiticas', label: 'Analíticas',      icon: Activity },
  { href: '/usuarios',   label: 'Usuarios',        icon: Shield, requiredRole: 'ADMIN' },
];

const SIDEBAR_EXPANDED = 224;
const SIDEBAR_COLLAPSED = 64;

export default function AppShell({ children, user }: { children: React.ReactNode; user: UserInfo }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = ROLE_BADGES[user.role] ?? ROLE_BADGES['TECNICO'];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('sidebar-collapsed');
      if (s !== null) setCollapsed(s === 'true');
    } catch { }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sidebar-collapsed', String(next)); } catch { }
  };

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const filteredLinks = NAV_LINKS.filter(l => !l.requiredRole || l.requiredRole === user.role);
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <div className="min-h-screen flex font-sans" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ── SIDEBAR (desktop) ───────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen border-r overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          width: sidebarW,
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Logo */}
        <Link
          href="/almacen"
          className="flex items-center gap-3 px-4 border-b shrink-0"
          style={{ height: 56, borderColor: 'var(--border)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
            style={{ background: 'var(--accent)' }}
          >
            <span className="text-white font-bold text-sm leading-none">M</span>
          </div>
          {!collapsed && (
            <span className="text-sm font-bold whitespace-nowrap overflow-hidden" style={{ color: 'var(--text-primary)' }}>
              Memrit Sears
            </span>
          )}
        </Link>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {filteredLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className="flex items-center rounded-xl transition-all duration-150 group"
                style={{
                  gap: collapsed ? 0 : 12,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? 'var(--accent-subtle)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'var(--bg-surface-alt)';
                    el.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'transparent';
                    el.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + collapse toggle */}
        <div className="shrink-0 px-2 pb-3 pt-2 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
          {!collapsed && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'var(--bg-surface-alt)' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}
              >
                <User className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user.email.split('@')[0]}
                </p>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block mt-0.5"
                  style={{ background: role.bg, color: role.color }}
                >
                  {role.label}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center rounded-xl py-2 text-xs font-medium transition-colors"
            style={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8,
              paddingLeft: collapsed ? 0 : 12,
              color: 'var(--text-muted)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'var(--bg-surface-alt)';
              el.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = '';
              el.style.color = 'var(--text-muted)';
            }}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <><ChevronLeft className="w-4 h-4" /><span>Colapsar</span></>
            }
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── TOP BAR ─────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-6 shrink-0"
          style={{
            height: 56,
            background: 'var(--bg-overlay)',
            borderBottom: '1px solid var(--border)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              className="p-2 rounded-xl"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/almacen" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <span className="text-white font-bold text-sm leading-none">M</span>
              </div>
              <span className="text-sm font-bold sm:block hidden" style={{ color: 'var(--text-primary)' }}>Memrit Sears</span>
            </Link>
          </div>

          {/* Desktop spacer */}
          <div className="hidden lg:block flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <Notifications />
            <div className="w-px h-5 mx-1 hidden sm:block" style={{ background: 'var(--border)' }} />
            <ThemeSwitcher />
          </div>
        </header>

        {/* ── MOBILE NAV ──────────────────────────────────────── */}
        {mobileOpen && (
          <div
            className="lg:hidden px-4 py-3 flex flex-col gap-1 border-b animate-slide-down"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            {filteredLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={
                    active
                      ? { background: 'var(--accent-subtle)', color: 'var(--accent)' }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
            <div className="pt-3 mt-1 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {user.email.split('@')[0]}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded ml-1" style={{ background: role.bg, color: role.color }}>
                  {role.label}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium w-full transition-colors"
                style={{ color: 'var(--danger)' }}
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ──────────────────────────────────────── */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
