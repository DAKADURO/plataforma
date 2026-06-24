'use client';

import { useState } from 'react';
import { Plus, Users, LayoutDashboard, ArrowRight, Search, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import NewClientModal from './NewClientModal';
import NewProjectModal from './NewProjectModal';

type ProjectTask = {
  status: string;
};

type Project = {
  id: string;
  name: string;
  progress: number;
  status: string;
  client: { name: string };
  tasks?: ProjectTask[];
};

type ClientOption = {
  id: string;
  name: string;
};

export default function KanbanBoard({ projects, clients, role }: { projects: Project[], clients: ClientOption[], role: string }) {
  const [isClientModalOpen, setClientModalOpen] = useState(false);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredProjects = projects.filter(p => {
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.client.name.toLowerCase().includes(term);
  });

  const columns = [
    { 
      id: 'NORMAL', 
      title: 'Normal', 
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      bgColor: 'bg-emerald-950/10',
      barColor: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
      countBg: 'bg-emerald-500/20 text-emerald-300'
    },
    { 
      id: 'RIESGO', 
      title: 'En Riesgo', 
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      bgColor: 'bg-amber-950/10',
      barColor: 'bg-gradient-to-r from-amber-600 to-amber-400',
      countBg: 'bg-amber-500/20 text-amber-300'
    },
    { 
      id: 'ATORADO', 
      title: 'Atorado', 
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      bgColor: 'bg-rose-950/10',
      barColor: 'bg-gradient-to-r from-red-600 to-rose-400',
      countBg: 'bg-rose-500/20 text-rose-300'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#151515] p-5 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <LayoutDashboard className="w-5 h-5 text-blue-400" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Tablero Kanban</span>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por proyecto o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/40 outline-none transition-shadow"
          />
        </div>

        {/* Action Buttons */}
        {role !== 'TECNICO' && (
          <div className="flex gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => setClientModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] hover:bg-white/5 border border-white/10 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Users className="w-4 h-4" />
              Nuevo Cliente
            </button>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </button>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {columns.map(col => {
          const colProjects = filteredProjects.filter(p => p.status === col.id);
          
          return (
            <div 
              key={col.id} 
              className={`flex flex-col rounded-[2rem] border border-white/5 overflow-hidden ${col.bgColor} backdrop-blur-md`}
            >
              {/* Column Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${col.color}`}>
                  {col.title}
                </h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md shadow-sm ${col.countBg}`}>
                  {colProjects.length}
                </span>
              </div>

              {/* Column Content / Swimlane */}
              <div className="p-4 space-y-4 h-[calc(100vh-22rem)] min-h-[500px] overflow-y-auto overflow-x-hidden
                scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-3">
                {colProjects.map(project => {
                  const totalTasks = project.tasks?.length || 0;
                  const completedTasks = project.tasks?.filter(t => t.status === 'COMPLETADA').length || 0;

                  return (
                    <Link href={`/proyectos/${project.id}`} key={project.id} className="block group">
                      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 
                        transition-all duration-300 ease-out 
                        group-hover:-translate-y-1 group-hover:border-white/20 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] group-hover:bg-[#1f1f1f]">
                        
                        {/* Title and Icon */}
                        <div className="flex justify-between items-start mb-3 gap-3">
                          <h4 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
                            {project.name}
                          </h4>
                          <div className="bg-white/5 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1">
                            <ArrowRight className="w-4 h-4 text-blue-400" />
                          </div>
                        </div>
                        
                        {/* Meta Tags */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                            <Users className="w-3.5 h-3.5 text-blue-400/80" />
                            <span className="truncate max-w-[120px]">{project.client.name}</span>
                          </div>
                          
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400/80" />
                            <span>{completedTasks}/{totalTasks} Tareas</span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progreso</span>
                            <span className="text-sm font-black text-white">{project.progress}%</span>
                          </div>
                          
                          {/* Thicker gradient progress bar */}
                          <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden border border-white/5 shadow-inner">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${col.barColor}`} 
                              style={{ width: `${project.progress}%` }}
                            >
                              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                            </div>
                          </div>
                        </div>

                      </div>
                    </Link>
                  );
                })}
                
                {colProjects.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                    <p className="text-sm font-medium text-slate-500">Sin proyectos</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <NewClientModal isOpen={isClientModalOpen} onClose={() => setClientModalOpen(false)} />
      <NewProjectModal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} clients={clients} />
    </div>
  );
}
