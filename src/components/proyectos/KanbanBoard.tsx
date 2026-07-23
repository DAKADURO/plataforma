/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Plus, Users, LayoutDashboard, ArrowRight, Search, CheckSquare } from 'lucide-react';
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

  const filteredProjects = projects.filter(p => {
    const term = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(term) || p.client.name.toLowerCase().includes(term);
    if (!matchesSearch) return false;
    if (activeFilter === 'Recientes') return p.progress < 20;
    if (activeFilter === 'Riesgo') return p.status === 'RIESGO' || p.status === 'ATORADO';
    return true;
  });

  const columns = [
    {
      id: 'NORMAL',
      title: 'Normal',
      color: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      bgColor: 'bg-[var(--success-bg)]',
      barColor: 'bg-emerald-500',
      countBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'RIESGO',
      title: 'En Riesgo',
      color: 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10',
      bgColor: 'bg-[var(--warning-bg)]',
      barColor: 'bg-amber-500',
      countBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    },
    {
      id: 'ATORADO',
      title: 'Atorado',
      color: 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10',
      bgColor: 'bg-[var(--danger-bg)]',
      barColor: 'bg-rose-500',
      countBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div
        className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border shadow-[var(--shadow-sm)]"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 rounded-lg" style={{ background: 'var(--accent-subtle)' }}>
            <LayoutDashboard className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Tablero Kanban
          </span>
        </div>

        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por proyecto o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[var(--border-focus)]"
            style={{
              background: 'var(--bg-surface-alt)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {role !== 'TECNICO' && (
          <div className="flex gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => setClientModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: 'var(--bg-surface-alt)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <Users className="w-4 h-4" />
              Nuevo Cliente
            </button>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-white"
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

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 px-2">
        {['Todos', 'Recientes', 'Riesgo'].map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={
              activeFilter === f
                ? { background: 'var(--accent)', color: '#fff' }
                : {
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Vista Móvil: lista plana agrupada por estado ── */}
      <div className="block lg:hidden space-y-6">
        {columns.map(col => {
          const colProjects = filteredProjects.filter(p => p.status === col.id);
          if (colProjects.length === 0) return null;
          return (
            <div key={col.id}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${col.color}`}>
                  {col.title}
                </h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${col.countBg}`}>
                  {colProjects.length}
                </span>
              </div>
              <div className="space-y-3">
                {colProjects.map(project => {
                  const allTasks = project.departments?.flatMap(d => d.tasks) || [];
                  const completedTasks = allTasks.filter(t => t.status === 'COMPLETADA').length;
                  return (
                    <Link href={`/proyectos/${project.id}`} key={project.id}>
                      <div
                        className="flex items-center gap-4 p-4 rounded-xl border transition-colors"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-focus)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{project.name}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{project.client.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-surface-alt)' }}>
                              <div className={`h-full rounded-full ${col.barColor}`} style={{ width: `${project.progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{project.progress}%</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
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
            <p className="text-sm font-medium">Sin proyectos</p>
          </div>
        )}
      </div>

      {/* Kanban Board (desktop) */}
      <div className="hidden lg:grid grid-cols-3 gap-6 items-start">
        {columns.map(col => {
          const colProjects = filteredProjects.filter(p => p.status === col.id);

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl overflow-hidden border ${col.bgColor}`}
              style={{ borderColor: 'var(--border)' }}
            >
              {/* Column Header */}
              <div
                className="p-5 flex items-center justify-between border-b"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
              >
                <h3 className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${col.color}`}>
                  {col.title}
                </h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${col.countBg}`}>
                  {colProjects.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="p-4 space-y-4 h-[calc(100vh-22rem)] min-h-[500px] overflow-y-auto overflow-x-hidden pr-3">
                {colProjects.map(project => {
                  const allTasks = project.departments?.flatMap(d => d.tasks) || [];
                  const totalTasks = allTasks.length;
                  const completedTasks = allTasks.filter(t => t.status === 'COMPLETADA').length;
                  const pendingTasks = allTasks.filter(t => t.status !== 'COMPLETADA');

                  return (
                    <Link href={`/proyectos/${project.id}`} key={project.id} className="block group">
                      <div
                        className="rounded-2xl p-5 transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-md)] border"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-focus)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
                      >
                        <div className="flex justify-between items-start mb-3 gap-3">
                          <h4
                            className="font-bold text-base leading-snug line-clamp-2 transition-colors group-hover:text-[var(--accent)]"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {project.name}
                          </h4>
                          <div
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1 shrink-0"
                            style={{ background: 'var(--bg-surface-alt)' }}
                          >
                            <ArrowRight className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                          </div>
                        </div>

                        {/* Meta Tags */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          <div
                            className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border"
                            style={{
                              background: 'var(--bg-surface-alt)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                            >
                              {project.client.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[120px] pr-1">{project.client.name}</span>
                          </div>

                          <div
                            className="relative group/tooltip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-help border"
                            style={{
                              background: 'var(--bg-surface-alt)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <CheckSquare className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                            <span>{completedTasks}/{totalTasks} Tareas</span>

                            <div
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-lg shadow-[var(--shadow-lg)] opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-10 border"
                              style={{
                                background: 'var(--bg-surface-alt)',
                                borderColor: 'var(--border)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              <p className="font-bold border-b pb-1 mb-1 text-[10px]" style={{ borderColor: 'var(--border)' }}>
                                Próximas tareas:
                              </p>
                              {pendingTasks.slice(0, 3).map((t, i) => (
                                <p key={i} className="truncate text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                                  • {t.name || 'Tarea'}
                                </p>
                              ))}
                              {pendingTasks.length === 0 && (
                                <p className="text-[10px]" style={{ color: 'var(--success)' }}>
                                  Todo completo ✨
                                </p>
                              )}
                              <div
                                className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
                                style={{ borderTopColor: 'var(--bg-surface-alt)' }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-end">
                            <span
                              className="text-[10px] font-bold uppercase tracking-widest"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Progreso
                            </span>
                            <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                              {project.progress}%
                            </span>
                          </div>
                          <div
                            className="w-full rounded-full h-2 overflow-hidden"
                            style={{ background: 'var(--bg-surface-alt)' }}
                          >
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${col.barColor}`}
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
                    className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-2xl"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      Sin proyectos
                    </p>
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
