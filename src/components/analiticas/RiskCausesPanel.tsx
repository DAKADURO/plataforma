'use client';

import Card from '@/components/ui/Card';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

type RiskCategoryCount = {
  category: string | null;
  _count: { category: number };
};

export default function RiskCausesPanel({ riskEvents }: { riskEvents: RiskCategoryCount[] }) {
  const total = riskEvents.reduce((acc, curr) => acc + (curr._count.category || 0), 0);

  return (
    <Card>
      <div className="flex items-center gap-3 border-b pb-4 mb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="p-2 rounded-xl" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Causas Frecuentes de Riesgo y Bloqueo
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Bitácora consolidada de incidentes reportados a nivel empresa
          </p>
        </div>
      </div>

      {riskEvents.length === 0 ? (
        <div className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          No hay eventos de riesgo o bloqueo registrados aún.
        </div>
      ) : (
        <div className="space-y-3">
          {riskEvents.map((item, idx) => {
            const count = item._count.category;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-alt)' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--warning)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {item.category || 'Sin categoría especificada'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-[var(--border)] h-2 rounded-full overflow-hidden hidden sm:block">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--warning)' }} />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    {count} {count === 1 ? 'evento' : 'eventos'} ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
