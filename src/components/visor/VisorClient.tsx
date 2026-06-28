'use client';

import { useEffect, useState } from 'react';
import { getProjects } from '@/app/actions/projects';
import { AlertTriangle, Activity, CheckCircle2, Factory, ListTodo, ShieldAlert, Radio, AlertOctagon } from 'lucide-react';

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
    <div className="min-h-screen bg-[#020817] relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* ── IMMERSIVE BACKGROUND ELEMENTS ── */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-900/10 blur-[100px] pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="relative z-10 p-6 md:p-10 max-w-screen-3xl mx-auto flex flex-col min-h-screen">
        
        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 pb-6 border-b border-white/10">
          <div className="flex flex-col items-center md:items-start text-center md:text-left mb-6 md:mb-0">
            <div className="flex items-center gap-4 mb-2">
              <div className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"></span>
                <span className="relative flex items-center justify-center rounded-full h-6 w-6 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                  <Radio className="w-3.5 h-3.5 text-white" />
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-md">
                CENTRO DE COMANDO
              </h1>
            </div>
            <p className="text-lg text-cyan-400/90 font-bold tracking-[0.2em] uppercase ml-1 drop-shadow-sm">
              Monitoreo Operativo Global
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end bg-black/40 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            {/* Glossy reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <p className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight tabular-nums mb-1">
              {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> 
              <span>Sincronizado</span>
            </div>
          </div>
        </header>

        {/* ── DASHBOARD GRID ── */}
        <main className="flex-1">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl">
              <Activity className="w-24 h-24 text-white/20 mb-6" />
              <p className="text-3xl text-white/40 font-bold tracking-tight">Sin operaciones activas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 auto-rows-max">
              {projects.sort((a, b) => {
                const order = { ATORADO: 0, RIESGO: 1, NORMAL: 2 };
                return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
              }).map(project => {
                
                const isAtorado = project.status === 'ATORADO';
                const isRiesgo = project.status === 'RIESGO';
                
                // --- Glassmorphism Styling Logic ---
                const baseCardStyle = "relative flex flex-col justify-between p-8 rounded-[2rem] backdrop-blur-2xl border transition-all duration-500 hover:-translate-y-1 overflow-hidden group";
                
                const borderStyle = isAtorado 
                  ? 'border-red-500/50 shadow-[0_8px_32px_rgba(239,68,68,0.25)] hover:shadow-[0_8px_40px_rgba(239,68,68,0.4)]' 
                  : isRiesgo 
                    ? 'border-amber-500/40 shadow-[0_8px_32px_rgba(245,158,11,0.15)] hover:shadow-[0_8px_40px_rgba(245,158,11,0.3)]' 
                    : 'border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-cyan-500/30 hover:shadow-[0_8px_40px_rgba(6,182,212,0.15)]';
                
                const bgStyle = isAtorado 
                  ? 'bg-gradient-to-br from-red-950/40 to-black/60' 
                  : isRiesgo 
                    ? 'bg-gradient-to-br from-amber-950/30 to-black/60' 
                    : 'bg-gradient-to-br from-white/[0.03] to-black/40';

                const progressGradient = isAtorado 
                  ? 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
                  : isRiesgo 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_15px_rgba(253,224,71,0.5)]' 
                    : 'bg-gradient-to-r from-cyan-600 to-blue-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]';

                const totalTasks = project.tasks?.length || 0;
                const pendingTasks = project.tasks?.filter(t => t.status !== 'COMPLETADA').length || 0;

                return (
                  <div key={project.id} className={`${baseCardStyle} ${borderStyle} ${bgStyle}`}>
                    
                    {/* Glass Reflection Highlight */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Pulse Effect for Critical Status */}
                    {isAtorado && (
                      <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none mix-blend-screen" />
                    )}

                    {/* ── CARD HEADER ── */}
                    <div className="relative z-10 mb-8">
                      <div className="flex justify-between items-start gap-4 mb-5">
                        <h3 className="text-2xl font-black text-white leading-tight tracking-tight drop-shadow-sm line-clamp-2">
                          {project.name}
                        </h3>
                        {isAtorado ? (
                          <div className="bg-red-500/10 p-2.5 rounded-2xl shrink-0 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-md">
                            <AlertOctagon className="w-8 h-8 text-red-500 animate-[pulse_1s_ease-in-out_infinite]" />
                          </div>
                        ) : isRiesgo ? (
                          <div className="bg-amber-500/10 p-2.5 rounded-2xl shrink-0 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-md">
                            <AlertTriangle className="w-8 h-8 text-amber-400" />
                          </div>
                        ) : null}
                      </div>

                      {/* Info Pills */}
                      <div className="flex flex-wrap gap-2.5">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/5 text-xs font-bold text-slate-300 backdrop-blur-sm shadow-inner">
                          <Factory className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="truncate max-w-[140px]">{project.client.name}</span>
                        </div>
                        
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/5 text-xs font-bold text-slate-300 backdrop-blur-sm shadow-inner">
                          <ListTodo className="w-3.5 h-3.5 text-slate-400" />
                          {totalTasks === 0 ? 'Sin tareas' : `${pendingTasks} pendientes`}
                        </div>
                      </div>
                    </div>

                    {/* ── ATORADO REASON ── */}
                    {isAtorado && project.blockReason && (
                      <div className="relative z-10 mb-8 bg-red-950/60 border border-red-500/30 rounded-2xl p-5 backdrop-blur-md shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                          <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.15em] opacity-90">Motivo del Bloqueo</p>
                        </div>
                        <p className="text-sm text-red-100/90 font-medium leading-relaxed">{project.blockReason}</p>
                      </div>
                    )}

                    {/* ── PROGRESS SECTION ── */}
                    <div className="relative z-10 mt-auto pt-4">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Avance Global</span>
                        <span className={`text-4xl font-black tabular-nums tracking-tighter drop-shadow-md ${
                          isAtorado ? 'text-red-400' : isRiesgo ? 'text-amber-400' : 'text-white'
                        }`}>
                          {project.progress}%
                        </span>
                      </div>
                      
                      {/* Premium Progress Bar Track */}
                      <div className="w-full bg-black/60 rounded-full h-5 overflow-hidden border border-white/10 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] p-1 relative">
                        {/* Fill */}
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${progressGradient}`}
                          style={{ width: `${project.progress}%` }}
                        >
                          {/* Shimmer overlay inside fill */}
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
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
    </div>
  );
}
