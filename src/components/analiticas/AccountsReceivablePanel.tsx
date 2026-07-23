'use client';

import { Receipt, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type PendingPayment = {
  id: string;
  concept: string;
  amount: number;
  dueDate: Date | null;
  project: { id: string; name: string; client: { name: string } };
};

function formatDateOnly(d: Date): string {
  return new Date(d).toLocaleDateString('es-MX', { timeZone: 'UTC' });
}

export default function AccountsReceivablePanel({
  summary,
}: {
  summary: { totalPending: number; totalOverdue: number; overdueCount: number; pending: PendingPayment[] } | null;
}) {
  if (!summary) return null;

  return (
    <div className="rounded-2xl border p-6 md:p-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <h2 className="text-xl font-bold flex items-center gap-3 mb-6" style={{ color: 'var(--text-primary)' }}>
        <Receipt className="w-6 h-6" style={{ color: 'var(--accent)' }} />
        Cuentas por Cobrar
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
            Total por Cobrar (toda la empresa)
          </span>
          <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>${summary.totalPending.toLocaleString()}</div>
        </div>
        <div
          className="p-4 rounded-xl border"
          style={summary.overdueCount > 0
            ? { background: 'var(--danger-bg)', borderColor: 'var(--danger)' }
            : { background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }
          }
        >
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: summary.overdueCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
            Vencido ({summary.overdueCount})
          </span>
          <div className="text-3xl font-black" style={{ color: summary.overdueCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            ${summary.totalOverdue.toLocaleString()}
          </div>
        </div>
      </div>

      {summary.pending.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No hay cobros pendientes.</p>
      ) : (
        <div className="space-y-2">
          {summary.pending.map(p => {
            const isOverdue = p.dueDate && new Date(p.dueDate) < new Date();
            return (
              <Link
                key={p.id}
                href={`/proyectos/${p.project.id}`}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border transition-colors"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.project.name}</p>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {p.project.client.name}</span>
                  </div>
                  <p className="text-xs flex items-center gap-1" style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {isOverdue && <AlertTriangle className="w-3 h-3" />}
                    {p.concept}{p.dueDate ? ` · Vence: ${formatDateOnly(p.dueDate)}` : ''}
                  </p>
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: 'var(--text-secondary)' }}>${p.amount.toLocaleString()}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
