'use client';

import { ArrowDown, ArrowUp, User, Calendar } from 'lucide-react';

type Movement = {
  id: string;
  quantity: number;
  type: string;
  date: Date;
  notes: string | null;
  user?: {
    email: string;
  } | null;
  project?: {
    name: string;
  } | null;
};

export default function MovementHistoryPanel({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) {
    return (
      <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm">No hay movimientos registrados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {movements.map(mov => (
        <div key={mov.id}
          className="p-4 rounded-xl border"
          style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg"
                style={{
                  background: mov.type === 'ENTRADA' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: mov.type === 'ENTRADA' ? 'var(--success)' : 'var(--danger)'
                }}>
                {mov.type === 'ENTRADA' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {mov.type === 'ENTRADA' ? 'Entrada' : 'Salida'}
                </p>
                <p className="text-xs font-bold" style={{
                  color: mov.type === 'ENTRADA' ? 'var(--success)' : 'var(--danger)'
                }}>
                  {mov.type === 'ENTRADA' ? '+' : '-'}{mov.quantity}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {new Date(mov.date).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {(mov.user || mov.project || mov.notes) && (
            <div className="flex flex-wrap gap-3 text-xs pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              {mov.user && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{mov.user.email}</span>
                </div>
              )}
              {mov.project && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Proyecto: {mov.project.name}</span>
                </div>
              )}
            </div>
          )}

          {mov.notes && (
            <div className="mt-2 p-2 rounded text-xs" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
              {mov.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
