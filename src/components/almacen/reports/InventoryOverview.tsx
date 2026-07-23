'use client';

import { Package, AlertTriangle, TrendingDown, Zap } from 'lucide-react';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function InventoryOverview({ stats, movement }: { stats: any; movement: any }) {
  const cards = [
    {
      title: 'Productos Totales',
      value: stats.totalProducts || 0,
      icon: Package,
      color: 'var(--accent)',
    },
    {
      title: 'Valor de Inventario',
      value: fmtCurrency(stats.totalInventoryValue || 0),
      icon: Zap,
      color: '#10b981',
    },
    {
      title: 'Bajo Stock',
      value: stats.lowStockCount || 0,
      icon: AlertTriangle,
      color: '#f59e0b',
    },
    {
      title: 'Alertas Activas',
      value: stats.activeAlerts || 0,
      icon: TrendingDown,
      color: '#ef4444',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-6 rounded-xl border"
              style={{
                background: 'var(--bg-surface-alt)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className="w-6 h-6" style={{ color: card.color }} />
              </div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                {card.title}
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Movement Summary */}
      {movement && movement.byType && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
            <p className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
              Movimientos (últimos 30 días)
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-primary)' }}>Entradas</span>
                <span className="text-2xl font-bold" style={{ color: '#10b981' }}>
                  +{movement.byType.ENTRADA || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-primary)' }}>Salidas</span>
                <span className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                  -{movement.byType.SALIDA || 0}
                </span>
              </div>
              <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                    {(movement.byType.ENTRADA || 0) + (movement.byType.SALIDA || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
            <p className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
              Top 5 Productos Movidos
            </p>
            <div className="space-y-2">
              {(movement.topItems || []).slice(0, 5).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {i + 1}. {item.name}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
