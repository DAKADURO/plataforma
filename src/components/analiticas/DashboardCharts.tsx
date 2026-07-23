/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
} from 'recharts';
import { TrendingUp, Package, Briefcase, Users, FileText, AlertOctagon, Activity } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  progress: number;
  status: string;
  client: { name: string };
  documents?: { id: string }[];
};

type Product = {
  id: string;
  name: string;
  stock: number;
  minStock: number;
};

const STATUS_COLORS: Record<string, string> = {
  NORMAL:  '#10b981',
  RIESGO:  '#f59e0b',
  ATORADO: '#f43f5e',
};

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string; payload?: any }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const color = payload[0]?.payload?.fill || payload[0]?.color || 'var(--accent)';

  return (
    <div
      className="rounded-xl px-4 py-3 shadow-[var(--shadow-lg)] min-w-[150px] border"
      style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
    >
      <div className="h-0.5 w-full rounded mb-3 -mt-3 -mx-4 px-4" style={{ background: color, width: 'calc(100% + 2rem)', marginLeft: '-1rem' }} />
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.payload?.fill || p.color }} />
            <span className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
          </span>
          <span className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>
            {p.value}{p.name === 'Progreso' ? '%' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardCharts({
  projects,
  products,
  clientCount,
}: {
  projects: Project[];
  products: Product[];
  clientCount: number;
}) {
  const statusData = useMemo(() => {
    const c = { NORMAL: 0, RIESGO: 0, ATORADO: 0 };
    projects.forEach(p => { if (p.status in c) c[p.status as keyof typeof c]++; });
    return [
      { name: 'Normal',    value: c.NORMAL,  color: STATUS_COLORS.NORMAL },
      { name: 'En Riesgo', value: c.RIESGO,  color: STATUS_COLORS.RIESGO },
      { name: 'Atorado',   value: c.ATORADO, color: STATUS_COLORS.ATORADO },
    ].filter(d => d.value > 0);
  }, [projects]);

  const progressData = useMemo(() =>
    projects.map(p => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
      Progreso: p.progress,
      fill: STATUS_COLORS[p.status] ?? 'var(--accent)',
    })), [projects]);

  const totalProjects  = projects.length;
  const lowStock       = products.filter(p => p.stock <= p.minStock).length;
  const atoradoCount   = projects.filter(p => p.status === 'ATORADO').length;
  const avgProgress    = totalProjects > 0
    ? Math.round(projects.reduce((a, p) => a + p.progress, 0) / totalProjects) : 0;
  const totalDocuments = projects.reduce((a, p) => a + (p.documents?.length ?? 0), 0);

  const kpis = [
    {
      label: 'Proyectos Activos',
      value: totalProjects,
      icon: Briefcase,
      accentColor: '#3b82f6',
      sub: `${atoradoCount} atorados`,
    },
    {
      label: 'Progreso Promedio',
      value: `${avgProgress}%`,
      icon: TrendingUp,
      accentColor: '#10b981',
      sub: 'del total de tareas',
    },
    {
      label: 'Alertas de Stock',
      value: lowStock,
      icon: Package,
      accentColor: '#f43f5e',
      sub: `${products.length} productos total`,
    },
    {
      label: 'Clientes Activos',
      value: clientCount,
      icon: Users,
      accentColor: '#f59e0b',
      sub: 'en portafolio',
    },
    {
      label: 'En Riesgo',
      value: projects.filter(p => p.status === 'RIESGO').length,
      icon: AlertOctagon,
      accentColor: '#f97316',
      sub: 'requieren atención',
    },
    {
      label: 'Documentos en DMS',
      value: totalDocuments,
      icon: FileText,
      accentColor: '#06b6d4',
      sub: 'archivos subidos',
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="relative flex flex-col justify-between rounded-2xl p-5 border overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: kpi.accentColor }}
              />
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 border"
                style={{
                  background: `${kpi.accentColor}18`,
                  borderColor: `${kpi.accentColor}30`,
                  color: kpi.accentColor,
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-3xl font-black tabular-nums tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                  {kpi.value}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {kpi.label}
                </p>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {kpi.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut — Estado de Proyectos */}
        <div
          className="lg:col-span-1 rounded-2xl p-6 border flex flex-col transition-shadow hover:shadow-[var(--shadow-md)]"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Distribución de Estados
            </h3>
          </div>

          {statusData.length === 0 ? (
            <div
              className="flex-1 flex flex-col items-center justify-center rounded-xl p-6 border-2 border-dashed"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <Activity className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-sm font-medium">Sin datos</p>
            </div>
          ) : (
            <>
              <div className="relative h-[220px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{totalProjects}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>Total</span>
                </div>
              </div>

              <div className="space-y-2 mt-auto">
                {statusData.map(d => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between p-3 rounded-xl border"
                    style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        {d.name}
                      </span>
                    </div>
                    <span className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bar — Avance por Proyecto */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 border flex flex-col transition-shadow hover:shadow-[var(--shadow-md)]"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Avance por Proyecto
              </h3>
            </div>
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Porcentaje %
            </span>
          </div>

          <div className="flex-1 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }} barSize={28}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(128,128,128,0.1)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#888', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                  dy={10}
                  interval={0}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#888', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  dx={-10}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128,128,128,0.05)', radius: 8 }} />
                <Bar dataKey="Progreso" radius={[6, 6, 6, 6]}>
                  {progressData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
