'use client';

import { useEffect, useState } from 'react';
import { getProjects } from '@/app/actions/projects';
import { AlertTriangle, Clock, Activity, CheckCircle2 } from 'lucide-react';

type ProjectWithClient = {
  id: string;
  name: string;
  status: string;
  progress: number;
  blockReason: string | null;
  client: { name: string };
};

export default function VisorClient({ initialProjects }: { initialProjects: ProjectWithClient[] }) {
  const [projects, setProjects] = useState<ProjectWithClient[]>(initialProjects);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const freshProjects = await getProjects();
        setProjects(freshProjects);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const atoradoProjects = projects.filter(p => p.status === 'ATORADO');
  const activeProjects = projects.filter(p => p.status !== 'ATORADO');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 flex flex-col font-sans">
      <header className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-4">
            <Activity className="w-12 h-12 text-blue-500" />
            Centro de Comando Operativo
          </h1>
          <p className="text-2xl text-slate-400 font-medium">Monitoreo de Proyectos en Tiempo Real</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white mb-1">
            {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xl text-slate-500 flex items-center justify-end gap-2">
            <Clock className="w-5 h-5" /> 
            Actualizado
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-8">
        {/* ATORADO (BLOCKED) PROJECTS - TOP PRIORITY */}
        {atoradoProjects.length > 0 && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-700">
            <h2 className="text-3xl font-bold text-rose-500 mb-6 flex items-center gap-3 uppercase tracking-widest">
              <AlertTriangle className="w-8 h-8" />
              Proyectos Atorados ({atoradoProjects.length})
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-6">
              {atoradoProjects.map(project => (
                <div key={project.id} className="bg-rose-950/40 border-2 border-rose-600/50 rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-rose-600 animate-pulse"></div>
                  <div className="pl-4">
                    <h3 className="text-4xl font-extrabold text-white mb-2">{project.name}</h3>
                    <p className="text-2xl text-rose-200 font-medium mb-6">{project.client.name}</p>
                    
                    <div className="bg-rose-950/80 border border-rose-500/30 rounded-xl p-6">
                      <p className="text-lg font-bold text-rose-400 uppercase tracking-wider mb-2">Motivo del Bloqueo:</p>
                      <p className="text-2xl text-white font-medium leading-relaxed">
                        {project.blockReason || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* NORMAL AND RISK PROJECTS */}
        <section className="flex-1 mt-4">
          <h2 className="text-3xl font-bold text-slate-300 mb-6 flex items-center gap-3 uppercase tracking-widest">
            Estado Operativo ({activeProjects.length})
          </h2>
          
          {activeProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-900/50 rounded-3xl border border-slate-800">
              <CheckCircle2 className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-2xl text-slate-500 font-medium">No hay proyectos activos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-6">
              {activeProjects.map(project => {
                const isRisk = project.status === 'RIESGO';
                
                return (
                  <div key={project.id} className={`bg-slate-900/80 border-2 rounded-2xl p-8 flex flex-col justify-between ${isRisk ? 'border-amber-500/30' : 'border-slate-800'}`}>
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-3xl font-bold text-white leading-tight line-clamp-2">{project.name}</h3>
                        {isRisk && <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-xl text-slate-400 font-medium mb-8">{project.client.name}</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-2xl font-bold text-slate-300">Progreso</span>
                        <span className={`text-4xl font-extrabold ${isRisk ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {project.progress}%
                        </span>
                      </div>
                      
                      {/* THICK PROGRESS BAR FOR TV */}
                      <div className="w-full bg-slate-800 rounded-full h-8 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            isRisk 
                              ? 'bg-gradient-to-r from-amber-600 to-amber-400' 
                              : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
