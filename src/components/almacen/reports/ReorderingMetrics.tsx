'use client';

import { AlertTriangle, TrendingUp, Trash2 } from 'lucide-react';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function ReorderingMetrics({ metrics }: { metrics: any }) {
  if (!metrics) {
    return <div style={{ color: 'var(--text-muted)' }}>Sin datos</div>;
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6" style={{ color: '#10b981' }} />
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Frecuentes</h3>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#10b981' }}>
            {(metrics.frequentlyReordered || []).length}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Productos frecuentemente reordenados</p>
        </div>

        <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-6 h-6" style={{ color: '#f59e0b' }} />
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Stock Muerto</h3>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#f59e0b' }}>
            {metrics.deadStockCount || 0}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {fmtCurrency(metrics.deadStockValue || 0)}
          </p>
        </div>

        <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6" style={{ color: '#ef4444' }} />
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Nunca Ordenados</h3>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
            {metrics.neverReorderedCount || 0}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Productos sin historial de compra</p>
        </div>
      </div>

      {/* Frequently Reordered */}
      {metrics.frequentlyReordered && metrics.frequentlyReordered.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Top 10 Productos Frecuentemente Reordenados
          </h3>
          <div className="space-y-2">
            {metrics.frequentlyReordered.map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
              >
                <div className="flex-1">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {i + 1}. {item.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    SKU: {item.sku} • Stock: {item.currentStock} / Mín: {item.minStock}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold px-3 py-1 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    {item.reorderCount}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dead Stock */}
      {metrics.deadStock && metrics.deadStock.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Stock Muerto - Productos sin movimiento
          </h3>
          <div className="space-y-2">
            {metrics.deadStock.slice(0, 10).map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.3)' }}
              >
                <div className="flex-1">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.sku} • {item.stock} unidades
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>
                    {fmtCurrency(item.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
