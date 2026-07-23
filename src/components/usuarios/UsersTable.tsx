'use client';

import { useState, useTransition } from 'react';
import { updateUserRole, updateUserHourlyCost } from '@/app/actions/users';
import { Shield, UserCog, Mail, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';

type User = {
  id: string;
  email: string;
  role: string;
  hourlyCost: number;
};

const ROLES = [
  { id: 'ADMIN',     label: 'Administrador (Control Total)',       color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { id: 'GERENTE',   label: 'Gerente (Visibilidad y Gestión)',     color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { id: 'TECNICO',   label: 'Técnico (Solo Lectura y Ejecución)',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'PENDIENTE', label: 'Pendiente (Sin Acceso)',              color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
];

export default function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ id: string; type: 'success' | 'error'; msg: string } | null>(null);

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        setFeedback({ id: userId, type: 'success', msg: 'Rol actualizado' });
      } else {
        setFeedback({ id: userId, type: 'error', msg: res.error || 'Error' });
        setUsers(initialUsers);
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  };

  const handleHourlyCostChange = (userId: string, value: string) => {
    const hourlyCost = Number(value);
    if (!Number.isFinite(hourlyCost) || hourlyCost < 0) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, hourlyCost } : u));
  };

  const handleHourlyCostSave = (userId: string, hourlyCost: number) => {
    startTransition(async () => {
      const res = await updateUserHourlyCost(userId, hourlyCost);
      if (res.success) {
        setFeedback({ id: userId, type: 'success', msg: 'Costo/hora actualizado' });
      } else {
        setFeedback({ id: userId, type: 'error', msg: res.error || 'Error' });
        setUsers(initialUsers);
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  };

  return (
    <div
      className="rounded-2xl overflow-hidden animate-fade-in border"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div
        className="p-6 border-b flex items-center justify-between"
        style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <UserCog className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          Directorio de Usuarios
        </h2>
        <span
          className="text-sm font-bold px-3 py-1 rounded-lg"
          style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          {users.length} Registros
        </span>
      </div>

      {/* Mobile card view */}
      <div className="block sm:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
        {users.map(user => {
          const currentRoleDef = ROLES.find(r => r.id === user.role) || ROLES[3];
          const fb = feedback?.id === user.id ? feedback : null;
          return (
            <div key={user.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{user.email}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>ID: {user.id.split('-')[0]}...</div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${currentRoleDef.color}`}>
                  <Shield className="w-3 h-3" />
                  {user.role}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {fb && (
                  <span className={`text-xs font-bold flex items-center gap-1 ${fb.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {fb.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {fb.msg}
                  </span>
                )}
                <select
                  value={user.role}
                  disabled={isPending}
                  onChange={e => handleRoleChange(user.id, e.target.value)}
                  className="flex-1 text-xs rounded-lg px-3 py-1.5 outline-none disabled:opacity-50 appearance-none"
                  style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={user.hourlyCost}
                  disabled={isPending}
                  onChange={e => handleHourlyCostChange(user.id, e.target.value)}
                  onBlur={e => handleHourlyCostSave(user.id, Number(e.target.value))}
                  className="flex-1 text-xs rounded-lg px-3 py-1.5 outline-none disabled:opacity-50"
                  style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  title="Costo por hora"
                />
                <span className="text-[10px] font-bold shrink-0" style={{ color: 'var(--text-muted)' }}>/hora</span>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <UserCog className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay usuarios registrados.</p>
          </div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="text-xs uppercase tracking-widest border-b"
              style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <th className="px-6 py-4 font-bold">Usuario / Email</th>
              <th className="px-6 py-4 font-bold">Rol Actual</th>
              <th className="px-6 py-4 font-bold">Costo/Hora</th>
              <th className="px-6 py-4 font-bold text-right">Asignar Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => {
              const currentRoleDef = ROLES.find(r => r.id === user.role) || ROLES[3];
              const fb = feedback?.id === user.id ? feedback : null;

              return (
                <tr
                  key={user.id}
                  className="transition-colors"
                  style={{ borderTop: i === 0 ? 'none' : `1px solid var(--border)` }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-alt)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}
                      >
                        <Mail className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div>
                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{user.email}</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          ID: {user.id.split('-')[0]}...
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold ${currentRoleDef.color}`}>
                      <Shield className="w-3.5 h-3.5" />
                      {user.role}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={user.hourlyCost}
                        disabled={isPending}
                        onChange={e => handleHourlyCostChange(user.id, e.target.value)}
                        onBlur={e => handleHourlyCostSave(user.id, Number(e.target.value))}
                        className="w-24 text-sm rounded-lg px-3 py-1.5 outline-none disabled:opacity-50"
                        style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                        title="Costo por hora"
                      />
                    </div>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {fb && (
                        <span
                          className={`text-xs font-bold flex items-center gap-1 animate-fade-in ${fb.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}
                        >
                          {fb.type === 'success'
                            ? <CheckCircle2 className="w-3.5 h-3.5" />
                            : <AlertTriangle className="w-3.5 h-3.5" />}
                          {fb.msg}
                        </span>
                      )}

                      <select
                        value={user.role}
                        disabled={isPending}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        className="text-sm rounded-xl px-4 py-2 outline-none cursor-pointer disabled:opacity-50 appearance-none pr-8"
                        style={{
                          background: 'var(--bg-surface-alt)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.7rem top 50%',
                          backgroundSize: '0.65rem auto',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                      >
                        {ROLES.map(r => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  <UserCog className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay usuarios registrados.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
