/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Plus, Users, LayoutDashboard, ArrowRight, Search, CheckSquare, Briefcase, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import NewClientModal from './NewClientModal';
import NewProjectModal from './NewProjectModal';

type ProjectDepartment = {
  tasks: { status: string; name?: string }[];
};

type Project = {
  id: string;
  name: string;
  progress: number;
  status: string;
  client: { name: string };
  departments?: ProjectDepartment[];
};

type ClientOption = {
  id: string;
  name: string;
};

export default function KanbanBoard({ projects, clients, role }: { projects: Project[], clients: ClientOption[], role: string }) {
  const [isClientModalOpen, setClientModalOpen] = useState(false);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');

  // Stats calculation
  const totalProjects = projects.length;
  const normalCount = projects.filter(p => p.status === 'NORMAL').length;
  const riskCount = projects.filter(p => p.status === 'RIESGO').length;
  const stuckCount = projects.filter(p => p.status === 'ATORADO').length;
  const avgProgress = totalProjects > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects)
    : 0;

  const filteredProjects = projects.filter(p => {
    const term = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(term) || p.client.name.toLowerCase().includes(term);
    if (!matchesSearch) return false;
    if (activeFilter === 'NORMAL') return p.status === 'NORMAL';
    if (activeFilter === 'RIESGO') return p.status === 'RIESGO';
    if (activeFilter === 'ATORADO') return p.status === 'ATORADO';
    if (activeFilter === 'RiesgoTotal') return p.status === 'RIESGO' || p.status === 'ATORADO';
    return true;
  });

  const columns = [
    {
      id: 'NORMAL',
      title: 'Normal / En Curso',
      color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
      bgColor: 'bg-[var(--success-bg)]',
      barColor: 'from-emerald-500 to-teal-400',
      dotColor: 'bg-emerald-500',
      countBg: 'bg-emerald-500/15 text-emerald-500',
    },
    {
      id: 'RIESGO',
      title: 'En Riesgo',
      color: 'text-amber-500 border-amber-500/20 bg-amber-500/10',
      bgColor: 'bg-[var(--warning-bg)]',
      barColor: 'from-amber-500 to-orange-400',
      dotColor: 'bg-amber-500',
      countBg: 'bg-amber-500/15 text-amber-500',
    },
    {
      id: 'ATORADO',
      title: 'Atorado',
      color: 'text-rose-500 border-rose-500/20 bg-rose-500/10',
      bgColor: 'bg-[var(--danger-bg)]',
      barColor: 'from-rose-500 to-red-600',
      dotColor: 'bg-rose-500',
      countBg: 'bg-rose-500/15 text-rose-500',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top KPI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border flex items-center justify-between shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Proyectos Activos</p>
            <p className="text-2xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>{totalProjects}</p>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: 'var(--accent-subtle)', borderColor: 'transparent' }}>
            <Briefcase className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl border flex items-center justify-between shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>En Curso Normal</p>
            <p className="text-2xl font-extrabold mt-1 text-emerald-500">{normalCount}</p>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'transparent' }}>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border flex items-center justify-between shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Atención Requerida</p>
            <p className="text-2xl font-extrabold mt-1" style={{ color: (riskCount + stuckCount) > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
              {riskCount + stuckCount} {stuckCount > 0 ? `(${stuckCount} atorados)` : ''}
            </p>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: (riskCount + stuckCount) > 0 ? 'rgba(245,158,11,0.1)' : 'var(--bg-surface-alt)', borderColor: 'transparent' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: (riskCount + stuckCount) > 0 ? '#f59e0b' : 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl border flex items-center justify-between shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Avance Promedio</p>
            <p className="text-2xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>{avgProgress}%</p>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
        </div>
      </div>

      {/* Header Controls & Toolbar */}
      <div
        className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <div className="p-2.5 rounded-xl border flex items-center justify-center" style={{ background: 'var(--accent-subtle)', borderColor: 'transparent' }}>
            <LayoutDashboard className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 className="font-extrabold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Tablero Kanban de Proyectos
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Monitoreo y avance en tiempo real</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por proyecto o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all border"
            style={{
              background: 'var(--bg-surface-alt)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Action buttons */}
        {role !== 'TECNICO' && (
          <div className="flex gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={() => setClientModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border"
              style={{
                background: 'var(--bg-surface-alt)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <Users className="w-4 h-4" />
              Nuevo Cliente
            </button>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-white shadow-md hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </button>
          </div>
        )}
      </div>

      {/* Quick Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <span className="text-xs font-bold uppercase tracking-wider shrink-0 mr-1" style={{ color: 'var(--text-muted)' }}>Filtrar:</span>
        {[
          { id: 'Todos', label: `Todos (${projects.length})` },
          { id: 'NORMAL', label: `🟢 Normal (${normalCount})` },
          { id: 'RIESGO', label: `⚠️ Riesgo (${riskCount})` },
          { id: 'ATORADO', label: `🚨 Atorado (${stuckCount})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0"
            style={
              activeFilter === f.id
                ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                : {
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    borderColor: 'var(--border)',
                  }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Vista Móvil ── */}
      <div className="block lg:hidden space-y-6">
        {columns.map(col => {
          const colProjects = filteredProjects.filter(p => p.status === col.id);
          if (colProjects.length === 0) return null;
          return (
            <div key={col.id} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border flex items-center gap-2 ${col.color}`}>
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  {col.title}
                </h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${col.countBg}`}>
                  {colProjects.length}
                </span>
              </div>
              <div className="space-y-3">
                {colProjects.map(project => {
                  const allTasks = project.departments?.flatMap(d => d.tasks) || [];
                  const completedTasks = allTasks.filter(t => t.status === 'COMPLETADA').length;
                  return (
                    <Link href={`/proyectos/${project.id}`} key={project.id} className="block">
                      <div
                        className="p-4 rounded-2xl border transition-all space-y-3"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-base leading-snug" style={{ color: 'var(--text-primary)' }}>{project.name}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>👤 {project.client.name}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 shrink-0 opacity-60" style={{ color: 'var(--accent)' }} />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span style={{ color: 'var(--text-muted)' }}>{completedTasks}/{allTasks.length} Tareas</span>
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{project.progress}%</span>
                          </div>
                          <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--bg-surface-alt)' }}>
                            <div className={`h-full rounded-full bg-gradient-to-r ${col.barColor}`} style={{ width: `${project.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <p className="text-sm font-medium">No se encontraron proyectos.</p>
          </div>
        )}
      </div>

      {/* ── Kanban Board Desktop ── */}
      <div className="hidden lg:grid grid-cols-3 gap-6 items-start">
        {columns.map(col => {
          const colProjects = filteredProjects.filter(p => p.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl overflow-hidden border shadow-sm"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              {/* Column Header */}
              <div
                className="p-4 flex items-center justify-between border-b"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    {col.title}
                  </h3>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${col.countBg}`}>
                  {colProjects.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="p-4 space-y-4 min-h-[480px] max-h-[calc(100vh-22rem)] overflow-y-auto overflow-x-hidden pr-2">
                {colProjects.map(project => {
                  const allTasks = project.departments?.flatMap(d => d.tasks) || [];
                  const totalTasks = allTasks.length;
                  const completedTasks = allTasks.filter(t => t.status === 'COMPLETADA').length;
                  const pendingTasks = allTasks.filter(t => t.status !== 'COMPLETADA');

                  return (
                    <Link href={`/proyectos/${project.id}`} key={project.id} className="block group">
                      <div
                        className="rounded-2xl p-5 transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-lg border"
                        style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-focus)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
                      >
                        {/* Title & Action Icon */}
                        <div className="flex justify-between items-start mb-3 gap-3">
                          <h4
                            className="font-bold text-base leading-snug line-clamp-2 transition-colors group-hover:text-[var(--accent)]"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {project.name}
                          </h4>
                          <div
                            className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shrink-0 border"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                          >
                            <ArrowRight className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                          </div>
                        </div>

                        {/* Client & Task Info */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border"
                            style={{
                              background: 'var(--bg-surface)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold"
                              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                            >
                              {project.client.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[120px]">{project.client.name}</span>
                          </div>

                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border"
                            style={{
                              background: 'var(--bg-surface)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <CheckSquare className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                            <span>{completedTasks}/{totalTasks} Tareas</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Avance</span>
                            <span className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {project.progress}%
                            </span>
                          </div>
                          <div
                            className="w-full rounded-full h-2 overflow-hidden p-0.5 border"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                          >
                            <div
                              className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${col.barColor}`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {colProjects.length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center h-36 border-2 border-dashed rounded-2xl"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                  >
                    <p className="text-xs font-medium">Sin proyectos en esta columna</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <NewClientModal isOpen={isClientModalOpen} onClose={() => setClientModalOpen(false)} />
      <NewProjectModal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} clients={clients} />
    </div>
  );
}
