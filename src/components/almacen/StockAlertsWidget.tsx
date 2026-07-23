'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { acknowledgeAlert, resolveAlert } from '@/app/actions/almacen';

type Alert = {
  id: string;
  alertType: string;
  severity: string;
  status: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    minStock: number;
  };
};

export default function StockAlertsWidget({ alerts, userRole }: { alerts: Alert[]; userRole: string }) {
  const [localAlerts, setLocalAlerts] = useState(alerts);
  const [isAcknowledging, setIsAcknowledging] = useState<string | null>(null);
  const canManage = userRole !== 'TECNICO';

  const handleAcknowledge = async (alertId: string) => {
    setIsAcknowledging(alertId);
    const res = await acknowledgeAlert(alertId);
    if (res.success) {
      setLocalAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a));
    }
    setIsAcknowledging(null);
  };

  const handleResolve = async (alertId: string) => {
    setIsAcknowledging(alertId);
    const res = await resolveAlert(alertId);
    if (res.success) {
      setLocalAlerts(prev => prev.filter(a => a.id !== alertId));
    }
    setIsAcknowledging(null);
  };

  const activeAlerts = localAlerts.filter(a => a.status === 'ACTIVE');
  const acknowledgedAlerts = localAlerts.filter(a => a.status === 'ACKNOWLEDGED');

  if (localAlerts.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="px-6 py-4 border-b flex items-center gap-3" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
        <AlertTriangle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
        <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          Alertas de Reposición ({activeAlerts.length})
        </h3>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {/* Active alerts */}
        {activeAlerts.map(alert => (
          <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-opacity-50 transition-colors"
            style={{ background: alert.severity === 'CRITICAL' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)' }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{alert.product.name}</p>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border
                  ${alert.severity === 'CRITICAL'
                    ? 'bg-red-500/10 text-red-600 border-red-500/30'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  }`}>
                  {alert.severity}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>SKU: {alert.product.sku}</span>
                <span className="font-semibold" style={{ color: alert.product.stock === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                  Stock: {alert.product.stock} / Mín: {alert.product.minStock}
                </span>
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={isAcknowledging === alert.id}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Reconocer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleResolve(alert.id)}
                  disabled={isAcknowledging === alert.id}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--success)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Resolver"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Acknowledged alerts (collapsed) */}
        {acknowledgedAlerts.length > 0 && (
          <div className="p-4 text-sm" style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-alt)' }}>
            {acknowledgedAlerts.length} alerta{acknowledgedAlerts.length > 1 ? 's' : ''} reconocida{acknowledgedAlerts.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
