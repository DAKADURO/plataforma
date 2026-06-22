'use client';

import { useState } from 'react';
import { Plus, Users, LayoutDashboard, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import NewClientModal from './NewClientModal';
import NewProjectModal from './NewProjectModal';

type Project = {
  id: string;
  name: string;
  progress: number;
  status: string;
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
    { id: 'NORMAL', title: 'Normal', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', barColor: 'bg-emerald-500' },
    { id: 'RIESGO', title: 'En Riesgo', color: 'bg-amber-100 text-amber-800 border-amber-200', barColor: 'bg-amber-500' },
    { id: 'ATORADO', title: 'Atorado', color: 'bg-rose-100 text-rose-800 border-rose-200', barColor: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-5 h-5 text-slate-500" />
          <span className="font-medium text-slate-700">Tablero General</span>
        </div>

        {role !== 'TECNICO' && (
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setClientModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Users className="w-4 h-4" />
              Nuevo Cliente
            </button>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-200"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(col => {
          const colProjects = projects.filter(p => p.status === col.id);
          
          return (
            <div key={col.id} className="bg-slate-100/50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${col.color}`}>
                  {col.title}
                </h3>
                <span className="text-sm font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full shadow-sm border border-slate-200">
                  {colProjects.length}
                </span>
              </div>

              <div className="space-y-4">
                {colProjects.map(project => (
                  <Link href={`/proyectos/${project.id}`} key={project.id} className="block group">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </h4>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
                      </div>
                      
                      <p className="text-xs font-medium text-slate-500 mb-4 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {project.client.name}
                      </p>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>Progreso</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ${col.barColor}`} 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                
                {colProjects.length === 0 && (
                  <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
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
