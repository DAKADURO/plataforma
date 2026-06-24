'use client';

import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
} from 'recharts';
import { TrendingUp, Package, Briefcase, Users, FileText, AlertOctagon } from 'lucide-react';

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

const PIE_COLORS: Record<string, string> = {
  NORMAL:  '#10b981',
  RIESGO:  '#f59e0b',
  ATORADO: '#ef4444',
};

// ─── Custom Tooltip (glassmorphism dark) ───────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm min-w-[130px]">
      {label && <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="text-slate-300 font-medium">{p.name}</span>
          <span className="text-white font-black">{p.value}{p.name === 'Progreso' ? '%' : ''}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut center label ──────────────────────────────────────────
function DonutCenterLabel({ cx, cy, total }: { cx?: number; cy?: number; total: number }) {
  return (
    <g>
      <text x={cx} y={cy! - 8} textAnchor="middle" className="fill-white" fontSize={28} fontWeight={900}>
        {total}
      </text>
      <text x={cx} y={cy! + 16} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={600} letterSpacing={1.5}>
        PROYECTOS
      </text>
    </g>
  );
}

// ─── Main Component ──────────────────────────────────────────────
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
      { name: 'Normal',    value: c.NORMAL,  color: PIE_COLORS.NORMAL },
      { name: 'En Riesgo', value: c.RIESGO,  color: PIE_COLORS.RIESGO },
      { name: 'Atorado',   value: c.ATORADO, color: PIE_COLORS.ATORADO },
    ].filter(d => d.value > 0);
  }, [projects]);

  const progressData = useMemo(() =>
    projects.map(p => ({
      name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name,
      Progreso: p.progress,
      fill: PIE_COLORS[p.status] ?? '#6366f1',
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
      accent: '#6366f1',
      bg: 'rgba(99,102,241,0.12)',
      border: 'border-indigo-500/20',
      sub: `${atoradoCount} atorado${atoradoCount !== 1 ? 's' : ''}`,
    },
    {
      label: 'Progreso Promedio',
      value: `${avgProgress}%`,
      icon: TrendingUp,
      accent: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      border: 'border-emerald-500/20',
      sub: 'del total de tareas',
    },
    {
      label: 'Alertas de Stock',
      value: lowStock,
      icon: Package,
      accent: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      border: 'border-red-500/20',
      sub: `${products.length} productos total`,
    },
    {
      label: 'Clientes Activos',
      value: clientCount,
      icon: Users,
      accent: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      border: 'border-amber-500/20',
      sub: 'en portafolio',
    },
    {
      label: 'Proyectos en Riesgo',
      value: projects.filter(p => p.status === 'RIESGO').length,
      icon: AlertOctagon,
      accent: '#f97316',
      bg: 'rgba(249,115,22,0.12)',
      border: 'border-orange-500/20',
      sub: 'requieren atención',
    },
    {
      label: 'Documentos Subidos',
      value: totalDocuments,
      icon: FileText,
      accent: '#38bdf8',
      bg: 'rgba(56,189,248,0.12)',
      border: 'border-sky-500/20',
      sub: 'en el DMS',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`relative flex flex-col justify-between bg-[#151515] backdrop-blur-md rounded-2xl p-5
                border ${kpi.border} shadow-lg overflow-hidden group hover:border-opacity-50 transition-all`}
            >
              {/* faint glow orb */}
              <div
                className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30 pointer-events-none transition-opacity group-hover:opacity-50"
                style={{ background: kpi.accent }}
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shrink-0"
                style={{ background: kpi.bg }}
              >
                <Icon className="w-5 h-5" style={{ color: kpi.accent }} />
              </div>
              <div>
                <p className="text-3xl font-black text-white tabular-nums leading-none mb-1">{kpi.value}</p>
                <p className="text-xs font-bold text-slate-400 leading-snug">{kpi.label}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Donut — Estado de Proyectos (2 cols) */}
        <div className="lg:col-span-2 bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-lg">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">
            Distribución de Estados
          </p>
          {statusData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-600">
              No hay proyectos aún.
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  {statusData.length > 0 && (
                    <text>
                      {/* Centered label rendered via customized label prop */}
                    </text>
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Total count centered visually below chart */}
          <div className="flex justify-center -mt-[150px] mb-[90px] pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-black text-white">{totalProjects}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 mt-2">
            {statusData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-400 font-medium">{d.name}</span>
                </div>
                <span className="font-black text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar — Avance por Proyecto (3 cols) */}
        <div className="lg:col-span-3 bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-lg">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">
            Avance por Proyecto (%)
          </p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData} margin={{ top: 0, right: 8, left: -22, bottom: 50 }} barSize={24}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 8 }}
                />
                <Bar dataKey="Progreso" radius={[6, 6, 0, 0]}>
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
