'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Building2, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Navigation */}
      <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
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
