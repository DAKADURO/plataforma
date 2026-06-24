'use client';

import { useState, useTransition } from 'react';
import { updateUserRole } from '@/app/actions/users';
import { Shield, UserCog, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';

type User = {
  id: string;
  email: string;
  role: string;
};

const ROLES = [
  { id: 'ADMIN', label: 'Administrador (Control Total)', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { id: 'GERENTE', label: 'Gerente (Visibilidad y Gestión)', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { id: 'TECNICO', label: 'Técnico (Solo Lectura y Ejecución)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'PENDIENTE', label: 'Pendiente (Sin Acceso)', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }
];

export default function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ id: string, type: 'success' | 'error', msg: string } | null>(null);

  const handleRoleChange = (userId: string, newRole: string) => {
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        setFeedback({ id: userId, type: 'success', msg: 'Rol actualizado' });
      } else {
        setFeedback({ id: userId, type: 'error', msg: res.error || 'Error' });
        // Revert on error
        setUsers(initialUsers);
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  };

  return (
    <div className="bg-[#151515] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in">
      <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <UserCog className="w-6 h-6 text-blue-400" />
          Directorio de Usuarios
        </h2>
        <span className="text-sm font-bold bg-white/10 text-slate-300 px-3 py-1 rounded-lg">
          {users.length} Registros
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 text-xs uppercase tracking-widest text-slate-500 border-b border-white/5">
              <th className="px-6 py-4 font-bold">Usuario / Email</th>
              <th className="px-6 py-4 font-bold">Rol Actual</th>
              <th className="px-6 py-4 font-bold text-right">Asignar Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(user => {
              const currentRoleDef = ROLES.find(r => r.id === user.role) || ROLES[3];
              const fb = feedback?.id === user.id ? feedback : null;

              return (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 shrink-0">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{user.email}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {user.id.split('-')[0]}...</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold ${currentRoleDef.color}`}>
                      <Shield className="w-3.5 h-3.5" />
                      {user.role}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {fb && (
                        <span className={`text-xs font-bold flex items-center gap-1 animate-fade-in ${fb.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {fb.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {fb.msg}
                        </span>
                      )}
                      
                      <select
                        value={user.role}
                        disabled={isPending}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-[#1a1a1a] border border-white/10 text-slate-300 text-sm rounded-xl px-4 py-2 
                          focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-white/20 transition-colors
                          disabled:opacity-50 appearance-none pr-8 relative"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                      >
                        {ROLES.map(r => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              )
            })}
            
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                  <UserCog className="w-12 h-12 text-slate-700 mx-auto mb-3" />
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
