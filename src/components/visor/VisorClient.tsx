'use client';

import { useEffect, useState } from 'react';
import { getProjects } from '@/app/actions/projects';
import { AlertTriangle, Clock, Activity, CheckCircle2, Factory, ListTodo, ShieldAlert, Radio } from 'lucide-react';

type ProjectTask = {
  status: string;
};

type ProjectWithClient = {
  id: string;
  name: string;
  status: string;
  progress: number;
  blockReason: string | null;
  client: { name: string };
  tasks: ProjectTask[];
};

export default function VisorClient({ initialProjects }: { initialProjects: ProjectWithClient[] }) {
  const [projects, setProjects] = useState<ProjectWithClient[]>(initialProjects);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const freshProjects = await getProjects();
        setProjects(freshProjects as ProjectWithClient[]);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    // Immersive Kiosk Background: Radial Gradient
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050b14] to-black text-slate-50 p-6 md:p-10 flex flex-col font-sans overflow-x-hidden selection:bg-blue-500/30">
      
      {/* FUTURISTIC HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 pb-6 border-b border-white/5 relative">
        {/* Glow behind header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full"></div>
        
        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left mb-6 md:mb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-500 border-2 border-blue-900 items-center justify-center">
                <Radio className="w-3 h-3 text-white" />
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              CENTRO DE COMANDO
            </h1>
          </div>
          <p className="text-xl text-blue-400/80 font-semibold tracking-widest uppercase">Monitoreo Operativo en Tiempo Real</p>
        </div>
        
        <div className="relative z-10 flex flex-col items-center md:items-end bg-slate-900/50 border border-slate-800/80 px-6 py-3 rounded-2xl backdrop-blur-xl shadow-2xl">
          <p className="text-4xl font-black text-white font-mono tracking-tight tabular-nums mb-1">
            {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-widest">
            <CheckCircle2 className="w-4 h-4" /> 
            <span>Sincronizado</span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] bg-slate-900/30 backdrop-blur-md rounded-3xl border border-slate-800/50 shadow-2xl">
            <Activity className="w-20 h-20 text-slate-700 mb-6" />
            <p className="text-3xl text-slate-500 font-bold tracking-tight">Sin operaciones activas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 auto-rows-max">
            {/* Sort: Atorado first, Riesgo second, Normal last */}
            {projects.sort((a, b) => {
              const order = { ATORADO: 0, RIESGO: 1, NORMAL: 2 };
              return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
            }).map(project => {
              
              const isAtorado = project.status === 'ATORADO';
              const isRiesgo = project.status === 'RIESGO';
              
              // Colors based on status
              const borderStyle = isAtorado 
                ? 'border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.25)]' 
                : isRiesgo 
                  ? 'border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.15)]' 
                  : 'border-slate-700/50 shadow-2xl hover:border-blue-500/30 transition-colors';
              
              const bgStyle = isAtorado ? 'bg-red-950/20' : isRiesgo ? 'bg-amber-950/10' : 'bg-slate-900/60';
              const progressGradient = isAtorado 
                ? 'bg-gradient-to-r from-red-600 to-rose-400' 
                : isRiesgo 
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-400' 
                  : 'bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]';

              // Task summary
              const totalTasks = project.tasks?.length || 0;
              const pendingTasks = project.tasks?.filter(t => t.status !== 'COMPLETADA').length || 0;

              return (
                <div 
                  key={project.id} 
                  className={`relative flex flex-col justify-between p-7 rounded-[2rem] backdrop-blur-xl border ${borderStyle} ${bgStyle} overflow-hidden group`}
                >
                  {/* Background Pulse for ATORADO */}
                  {isAtorado && (
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                  )}

                  {/* Header: Name and Alert Icon */}
                  <div className="relative z-10 mb-8">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h3 className="text-2xl font-black text-white leading-tight tracking-tight line-clamp-2">
                        {project.name}
                      </h3>
                      {isAtorado ? (
                        <div className="bg-red-500/20 p-2 rounded-xl shrink-0 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                          <ShieldAlert className="w-7 h-7 text-red-500 animate-pulse" />
                        </div>
                      ) : isRiesgo ? (
                        <div className="bg-amber-500/10 p-2 rounded-xl shrink-0 border border-amber-500/20">
                          <AlertTriangle className="w-7 h-7 text-amber-500" />
                        </div>
                      ) : null}
                    </div>

                    {/* Badges / Meta Info */}
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
                        <Factory className="w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate max-w-[150px]">{project.client.name}</span>
                      </div>
                      
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
                        <ListTodo className="w-3.5 h-3.5 text-slate-400" />
                        {totalTasks === 0 ? 'Sin tareas' : `${pendingTasks} pendientes`}
                      </div>
                    </div>
                  </div>

                  {/* Block Reason Highlight (Only for Atorado) */}
                  {isAtorado && project.blockReason && (
                    <div className="relative z-10 mb-6 bg-red-950/80 border border-red-500/40 rounded-xl p-4 shadow-inner">
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 opacity-80">Razón de Bloqueo</p>
                      <p className="text-sm text-red-100 font-medium leading-relaxed">{project.blockReason}</p>
                    </div>
                  )}

                  {/* Progress Section */}
                  <div className="relative z-10 mt-auto">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Avance Global</span>
                      <span className={`text-3xl font-black tabular-nums tracking-tighter ${
                        isAtorado ? 'text-red-400' : isRiesgo ? 'text-amber-400' : 'text-white'
                      }`}>
                        {project.progress}%
                      </span>
                    </div>
                    
                    {/* THICK PROGRESS BAR */}
                    <div className="w-full bg-slate-900/80 rounded-full h-4 overflow-hidden border border-white/5 shadow-inner p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${progressGradient}`}
                        style={{ width: `${project.progress}%` }}
                      >
                        {/* Shimmer effect inside progress bar */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      </div>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  );
}
