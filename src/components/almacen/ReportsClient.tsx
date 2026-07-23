'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Building2, AlertTriangle, Printer, Download } from 'lucide-react';
import InventoryOverview from './reports/InventoryOverview';
import MovementChart from './reports/MovementChart';
import DepartmentStats from './reports/DepartmentStats';
import ReorderingMetrics from './reports/ReorderingMetrics';

type Tab = 'overview' | 'movements' | 'departments' | 'metrics';

const TABS = [
  { id: 'overview' as const, label: 'Resumen', icon: BarChart3 },
  { id: 'movements' as const, label: 'Movimientos', icon: TrendingUp },
  { id: 'departments' as const, label: 'Departamentos', icon: Building2 },
  { id: 'metrics' as const, label: 'Métricas', icon: AlertTriangle },
];

export default function ReportsClient({
  stats,
  movement,
  departments,
  metrics,
  userRole,
}: {
  stats: any;
  movement: any;
  departments: any;
  metrics: any;
  userRole: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!stats || Object.keys(stats).length === 0) return;

    const exportData = [
      {
        'Métrica': 'Productos Totales',
        'Valor': stats.totalProducts || 0,
      },
      {
        'Métrica': 'Valor de Inventario',
        'Valor': stats.totalInventoryValue || 0,
      },
      {
        'Métrica': 'Bajo Stock',
        'Valor': stats.lowStockCount || 0,
      },
      {
        'Métrica': 'Alertas Activas',
        'Valor': stats.activeAlerts || 0,
      },
    ];

    const csvContent = [
      'Métrica,Valor',
      ...exportData.map(row => `${row['Métrica']},${row['Valor']}`),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `almacen-reportes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in print:space-y-2">
      {/* Action buttons */}
      <div className="flex gap-2 justify-end print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors"
          style={{
            background: 'var(--bg-surface-alt)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-focus)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors"
          style={{
            background: 'var(--bg-surface-alt)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-focus)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b overflow-x-auto print:border-b print:mb-4" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
              style={{
                borderColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {activeTab === 'overview' && <InventoryOverview stats={stats} movement={movement} />}
        {activeTab === 'movements' && <MovementChart movement={movement} />}
        {activeTab === 'departments' && <DepartmentStats departments={departments} />}
        {activeTab === 'metrics' && <ReorderingMetrics metrics={metrics} />}
      </div>
    </div>
  );
}
