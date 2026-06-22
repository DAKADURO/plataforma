'use client';

import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import Card from '@/components/ui/Card';
import { TrendingUp, Package, Briefcase } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  progress: number;
  status: string;
  client: { name: string };
};

type Product = {
  id: string;
  name: string;
  stock: number;
  minStock: number;
};

const PIE_COLORS: Record<string, string> = {
  NORMAL:  '#10b981',
  RIESGO:  '#f59e0b',
  ATORADO: '#f43f5e',
};

export default function DashboardCharts({ projects, products }: { projects: Project[], products: Product[] }) {
  const statusData = useMemo(() => {
    const c = { NORMAL: 0, RIESGO: 0, ATORADO: 0 };
    projects.forEach(p => { if (p.status in c) c[p.status as keyof typeof c]++; });
    return [
      { name: 'Normal',    value: c.NORMAL,  color: PIE_COLORS.NORMAL },
      { name: 'En Riesgo', value: c.RIESGO,  color: PIE_COLORS.RIESGO },
      { name: 'Atorado',   value: c.ATORADO, color: PIE_COLORS.ATORADO },
    ].filter(d => d.value > 0);
  }, [projects]);

  const progressData = useMemo(() =>
    projects.map(p => ({
      name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
      Progreso: p.progress,
      fill: PIE_COLORS[p.status] ?? '#6366f1',
    })), [projects]);

  const totalProjects = projects.length;
  const lowStock = products.filter(p => p.stock <= p.minStock).length;
  const avgProgress = totalProjects > 0
    ? Math.round(projects.reduce((a, p) => a + p.progress, 0) / totalProjects)
    : 0;

  const kpis = [
    { label: 'Proyectos Activos',  value: totalProjects, icon: Briefcase, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    { label: 'Progreso Promedio',  value: `${avgProgress}%`, icon: TrendingUp,  color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Alertas de Stock',   value: lowStock,      icon: Package,    color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
  ];

  const tooltipStyle = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-md)',
    fontSize: '13px',
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: kpi.bg }}>
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
                  <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pie — Estado de Proyectos */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-6" style={{ color: 'var(--text-secondary)' }}>
            DISTRIBUCIÓN DE ESTADOS
          </h3>
          {statusData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay proyectos aún.
            </div>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="40%" cy="50%" innerRadius={60} outerRadius={85}
                    paddingAngle={4} dataKey="value" stroke="none">
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Legend */}
          <div className="flex gap-5 mt-2 flex-wrap">
            {statusData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </Card>

        {/* Bar — Avance */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-6" style={{ color: 'var(--text-secondary)' }}>
            AVANCE POR PROYECTO
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData} margin={{ top: 0, right: 10, left: -25, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--bg-surface-alt)' }} />
                <Bar dataKey="Progreso" radius={[4, 4, 0, 0]}>
                  {progressData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>
    </div>
  );
}
