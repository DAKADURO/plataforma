'use client';

import { TrendingUp, Package, AlertTriangle } from 'lucide-react';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function DepartmentStats({ departments }: { departments: any }) {
  if (!departments || Object.keys(departments).length === 0) {
    return <div style={{ color: 'var(--text-muted)' }}>Sin datos</div>;
  }

  const DEPT_COLORS: Record<string, string> = {
    'General': 'var(--accent)',
    'HVAC': '#06b6d4',
    'Eléctrico': '#f59e0b',
    'Plomería': '#3b82f6',
    'Civil': '#10b981',
    'Sistemas': '#a855f7',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(departments).map(([dept, stats]: [string, any], i) => (
          <div
            key={i}
            className="p-6 rounded-xl border"
            style={{
              background: 'var(--bg-surface-alt)',
              borderColor: DEPT_COLORS[dept] || 'var(--border)',
              borderWidth: '2px',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {dept}
              </h3>
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: DEPT_COLORS[dept] || 'var(--accent)' }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Productos</span>
                </div>
                <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {stats.itemCount || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Movimientos</span>
                </div>
                <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {stats.movementCount || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Bajo Stock</span>
                </div>
                <span className="font-bold text-lg" style={{ color: stats.lowStockCount > 0 ? '#ef4444' : '#10b981' }}>
                  {stats.lowStockCount || 0}
                </span>
              </div>

              <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Valor Total
                  </span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {fmtCurrency(stats.totalValue || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
