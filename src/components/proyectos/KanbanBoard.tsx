'use client';

import { useState } from 'react';
import { Plus, Users, LayoutDashboard, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import NewClientModal from './NewClientModal';
import NewProjectModal from './NewProjectModal';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Project = {
  id: string;
  name: string;
  progress: number;
  status: string;
  phase: string;
  client: { name: string };
};

type ClientOption = {
  id: string;
  name: string;
};

export default function KanbanBoard({ projects, clients, role }: { projects: Project[], clients: ClientOption[], role: string }) {
  const [isClientModalOpen, setClientModalOpen] = useState(false);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);

  const columns = [
    { id: 'NORMAL', title: 'Normal', color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', barColor: 'bg-emerald-500' },
    { id: 'RIESGO', title: 'En Riesgo', color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/20', barColor: 'bg-amber-500' },
    { id: 'ATORADO', title: 'Atorado', color: 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/20', barColor: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#151515] p-4 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 transition-colors">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">Tablero General</span>
        </div>

        {role !== 'TECNICO' && (
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={() => setClientModalOpen(true)}
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              <Users className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
            <Button
              onClick={() => setProjectModalOpen(true)}
              variant="primary"
              className="flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(col => {
          const colProjects = projects.filter(p => p.status === col.id);
          
          return (
            <div key={col.id} className="bg-slate-50/50 dark:bg-black/20 rounded-2xl p-4 border border-slate-200 dark:border-white/5">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${col.color}`}>
                  {col.title}
                </h3>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1a1a1a] px-2.5 py-0.5 rounded-full shadow-sm border border-slate-200 dark:border-white/10">
                  {colProjects.length}
                </span>
              </div>

              <div className="space-y-4">
                {colProjects.map(project => (
                  <Link href={`/proyectos/${project.id}`} key={project.id} className="block group">
                    <Card hoverEffect className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {project.name}
                        </h4>
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {project.client.name}
                        </p>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-500/20 truncate">
                          {project.phase}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <span>Progreso</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ${col.barColor}`} 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
                
                {colProjects.length === 0 && (
                  <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400 dark:text-slate-500 text-sm">
                    Sin proyectos
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
