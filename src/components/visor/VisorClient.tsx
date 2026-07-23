/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getProjects } from '@/app/actions/projects';
import { 
  AlertTriangle, Activity, CheckCircle2, Factory, 
  ListTodo, ShieldAlert, Radio, AlertOctagon, Clock,
  Maximize, Minimize, LayoutGrid, Monitor, Volume2, VolumeX,
  ChevronLeft, ChevronRight, Pause, Play, TrendingUp, Layers, Wrench, Zap, Cpu, Settings
} from 'lucide-react';
import Link from 'next/link';

type ProjectTask = {
  status: string;
};

type ProjectDepartment = {
  id?: string;
  name: string;
  progress?: number;
  tasks?: ProjectTask[];
};

type ProjectWithClient = {
  id: string;
  name: string;
  status: string;
  progress: number;
  blockReason: string | null;
  client: { name: string };
  departments?: ProjectDepartment[];
};

const DEPT_ICONS: Record<string, typeof Wrench> = {
  'Mecánico': Wrench,
  'Eléctrico': Zap,
  'Fabricación': Cpu,
  'Integración': Settings,
};

export default function VisorClient({ initialProjects }: { initialProjects: ProjectWithClient[] }) {
  const [projects, setProjects] = useState<ProjectWithClient[]>(initialProjects);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [countdown, setCountdown] = useState(30);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel' | 'critical'>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselAuto, setIsCarouselAuto] = useState(true);
  const [carouselTimer, setCarouselTimer] = useState(10);

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data Refresh Effect (30s)
  const refreshData = useCallback(async () => {
    try {
      const freshProjects = await getProjects();
      setProjects(freshProjects as ProjectWithClient[]);
      setLastUpdate(new Date());
      setCountdown(30);
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          refreshData();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshData]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Carousel Auto Rotation Effect (10s)
  useEffect(() => {
    if (viewMode !== 'carousel' || !isCarouselAuto || projects.length === 0) return;

    const timer = setInterval(() => {
      setCarouselTimer(prev => {
        if (prev <= 1) {
          setCarouselIndex(curr => (curr + 1) % projects.length);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [viewMode, isCarouselAuto, projects.length]);

  // Stats Computations
  const totalProjects = projects.length;
  const atoradoProjects = projects.filter(p => p.status === 'ATORADO');
  const riesgoProjects = projects.filter(p => p.status === 'RIESGO');
  const normalProjects = projects.filter(p => p.status === 'NORMAL');

  const globalAvgProgress = totalProjects > 0 
    ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects) 
    : 0;

  const allTasks = projects.flatMap(p => p.departments?.flatMap(d => d.tasks || []) || []);
  const totalTasksCount = allTasks.length;
  const completedTasksCount = allTasks.filter(t => t.status === 'COMPLETADA').length;
  const pendingTasksCount = totalTasksCount - completedTasksCount;

  // Filtered projects for views
  const displayedProjects = viewMode === 'critical' 
    ? projects.filter(p => p.status === 'ATORADO' || p.status === 'RIESGO')
    : projects.sort((a, b) => {
        const order = { ATORADO: 0, RIESGO: 1, NORMAL: 2 };
        return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
      });

  const activeCarouselProject = projects[carouselIndex % Math.max(1, projects.length)];

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-x-hidden font-sans text-slate-200 select-none">
      
      {/* ── INDUSTRIAL AMBIENT BACKGROUND GLOWS ── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-blue-600/[0.04] blur-[180px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/[0.03] blur-[180px] pointer-events-none rounded-full" />
      <div className="fixed top-1/3 right-0 w-[500px] h-[500px] bg-indigo-600/[0.03] blur-[180px] pointer-events-none rounded-full" />
      
      {/* Subtle Background Grid Lines Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`, backgroundSize: '32px 32px' }}
      />

      <div className="relative z-10 p-4 md:p-8 lg:p-10 max-w-[1800px] mx-auto flex flex-col min-h-screen">
        
        {/* ── 1. HEADER TELEMETRÍA SUPERIOR ── */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 pb-6 border-b border-white/10 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <Radio className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                  Centro de Comando
                </h1>
                <span className="bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-inner">
                  Piso de Planta TV
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                Memrit Sears — Monitoreo Operativo B2B
              </p>
            </div>
          </div>

          {/* Right Telemetry Widget Bar */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            
            {/* View Switchers */}
            <div className="flex items-center bg-[#0d1117] border border-white/10 p-1 rounded-2xl gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Vista Grid Bento"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              
              <button
                onClick={() => setViewMode('carousel')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'carousel' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Modo Carrusel Enfocado"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Carrusel TV</span>
              </button>

              <button
                onClick={() => setViewMode('critical')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'critical' 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Solo Alertas Críticas"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Críticos {atoradoProjects.length + riesgoProjects.length > 0 && `(${atoradoProjects.length + riesgoProjects.length})`}</span>
              </button>
            </div>

            {/* Countdown / Sync Pulse */}
            <div className="flex items-center gap-3 bg-[#0d1117] border border-white/10 px-4 py-2 rounded-2xl">
              <div className="relative flex h-3 w-3 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Sincro en</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{countdown}s</span>
              </div>
            </div>

            {/* Live Digital Clock */}
            <div className="flex items-center gap-3 bg-[#0d1117] border border-white/10 px-4 py-2 rounded-2xl">
              <Clock className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Hora Local</span>
                <span className="text-xs font-mono font-bold text-white">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Fullscreen & Audio Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-xl bg-[#0d1117] border border-white/10 text-slate-400 hover:text-white transition-colors"
                title={soundEnabled ? "Silenciar audio" : "Activar audio"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-[#0d1117] border border-white/10 text-slate-400 hover:text-white transition-colors"
                title="Pantalla Completa"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </header>

        {/* ── 2. ALERT MARQUEE / TICKER DE EMERGENCIAS ── */}
        {(atoradoProjects.length > 0 || riesgoProjects.length > 0) && (
          <div className="mb-6 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.15)] animate-pulse">
            <div className="flex items-center gap-2 bg-rose-600 text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-xl shrink-0">
              <AlertOctagon className="w-4 h-4" />
              Alerta Operativa
            </div>
            <div className="overflow-hidden whitespace-nowrap flex-1">
              <div className="inline-block animate-marquee font-mono text-xs text-rose-200 font-semibold">
                {atoradoProjects.map(p => `🔴 ATORADO: ${p.client.name} — "${p.name}" (${p.blockReason || 'Sin motivo indicado'})`).join('  |  ')}
                {riesgoProjects.length > 0 && `  |  ` + riesgoProjects.map(p => `🟡 EN RIESGO: ${p.client.name} — "${p.name}"`).join('  |  ')}
              </div>
            </div>
          </div>
        )}

        {/* ── 3. BARRA DE KPIS GLOBALES DE LA PLANTA ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
          
          {/* Salud Operativa Global */}
          <div className="bg-[#0a0e17]/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salud Global</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-white font-mono">{globalAvgProgress}%</span>
              <span className="text-[10px] font-semibold text-slate-400">Avance Promedio</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1 mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full" style={{ width: `${globalAvgProgress}%` }} />
            </div>
          </div>

          {/* Proyectos Atorados */}
          <div className={`backdrop-blur-md border p-4 rounded-2xl flex flex-col justify-between transition-colors ${
            atoradoProjects.length > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[#0a0e17]/80 border-white/10'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Atorados</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl lg:text-3xl font-black font-mono ${atoradoProjects.length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {atoradoProjects.length}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Críticos</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-2 truncate">Requieren intervención urgente</span>
          </div>

          {/* Proyectos en Riesgo */}
          <div className={`backdrop-blur-md border p-4 rounded-2xl flex flex-col justify-between transition-colors ${
            riesgoProjects.length > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#0a0e17]/80 border-white/10'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">En Riesgo</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl lg:text-3xl font-black font-mono ${riesgoProjects.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {riesgoProjects.length}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">En Observación</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-2 truncate">Atención requerida</span>
          </div>

          {/* Proyectos En Regla */}
          <div className="bg-[#0a0e17]/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">En Regla</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-white font-mono">{normalProjects.length}</span>
              <span className="text-[10px] font-semibold text-slate-400">Normales</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-2 truncate">Operando a tiempo</span>
          </div>

          {/* Tareas Totales de Planta */}
          <div className="bg-[#0a0e17]/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col justify-between col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tareas de Piso</span>
              <ListTodo className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-white font-mono">{pendingTasksCount}</span>
              <span className="text-[10px] font-semibold text-slate-400">/ {totalTasksCount} totales</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-2 truncate">{completedTasksCount} tareas completadas</span>
          </div>

        </div>

        {/* ── 4. CONTENIDO PRINCIPAL SEGÚN MODO DE VISTA ── */}
        <main className="flex-1 flex flex-col">
          {displayedProjects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl bg-[#0a0e17]/50 text-center">
              <Activity className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
              <p className="text-xl text-slate-300 font-bold mb-1">No hay proyectos para mostrar</p>
              <p className="text-sm text-slate-500">
                {viewMode === 'critical' ? '¡Excelente! No hay proyectos en estado Atorado o en Riesgo.' : 'Registra nuevos proyectos en el panel principal.'}
              </p>
            </div>
          ) : viewMode === 'carousel' ? (
            
            /* ── MODO CARRUSEL ENFOCADO (TV FOCUS SPOTLIGHT) ── */
            activeCarouselProject && (
              <div className="flex-1 flex flex-col justify-between bg-[#080c14] border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl">
                
                {/* Glowing Top Status Strip */}
                <div className={`absolute top-0 left-0 right-0 h-2 ${
                  activeCarouselProject.status === 'ATORADO' ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-400' :
                  activeCarouselProject.status === 'RIESGO' ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600' :
                  'bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400'
                }`} />

                {/* Carousel Header Nav */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                      PROYECTO {carouselIndex + 1} DE {projects.length}
                    </span>
                    <button 
                      onClick={() => setIsCarouselAuto(!isCarouselAuto)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                        isCarouselAuto ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      {isCarouselAuto ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isCarouselAuto ? `Auto (${carouselTimer}s)` : 'Pausado'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setCarouselIndex(curr => (curr - 1 + projects.length) % projects.length);
                        setCarouselTimer(10);
                      }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setCarouselIndex(curr => (curr + 1) % projects.length);
                        setCarouselTimer(10);
                      }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Main Spotlight Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1 my-auto">
                  
                  {/* Left Column: Project Metadata */}
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Factory className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{activeCarouselProject.client.name}</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight">
                        {activeCarouselProject.name}
                      </h2>
                    </div>

                    {/* Status Badge & Details */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border ${
                        activeCarouselProject.status === 'ATORADO' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.2)]' :
                        activeCarouselProject.status === 'RIESGO' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                      }`}>
                        ESTADO: {activeCarouselProject.status}
                      </span>
                    </div>

                    {/* Blocked Reason Card */}
                    {activeCarouselProject.status === 'ATORADO' && activeCarouselProject.blockReason && (
                      <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200">
                        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-rose-400 mb-1">
                          <ShieldAlert className="w-4 h-4" />
                          Motivo de Bloqueo Crítico
                        </div>
                        <p className="text-lg font-semibold">{activeCarouselProject.blockReason}</p>
                      </div>
                    )}

                    {/* Department Progress Chips */}
                    {activeCarouselProject.departments && activeCarouselProject.departments.length > 0 && (
                      <div>
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 block">
                          Avance por Departamentos
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          {activeCarouselProject.departments.map(dept => {
                            const IconComponent = DEPT_ICONS[dept.name] || Layers;
                            return (
                              <div key={dept.name} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <IconComponent className="w-4 h-4 text-blue-400" />
                                  <span className="text-xs font-bold text-slate-200">{dept.name}</span>
                                </div>
                                <span className="text-xs font-mono font-bold text-white">{dept.progress || 0}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right Column: Giant Radial Progress Gauge */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-white/[0.02] border border-white/10 rounded-3xl">
                    <div className="relative flex items-center justify-center w-64 h-64">
                      {/* SVG Gauge */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50" cy="50" r="42"
                          stroke="currentColor" strokeWidth="8"
                          className="text-white/5" fill="transparent"
                        />
                        <circle
                          cx="50" cy="50" r="42"
                          stroke="currentColor" strokeWidth="8"
                          strokeDasharray={263.89}
                          strokeDashoffset={263.89 - (263.89 * activeCarouselProject.progress) / 100}
                          strokeLinecap="round"
                          className={`transition-all duration-1000 ${
                            activeCarouselProject.status === 'ATORADO' ? 'text-rose-500' :
                            activeCarouselProject.status === 'RIESGO' ? 'text-amber-500' : 'text-blue-500'
                          }`}
                          fill="transparent"
                        />
                      </svg>
                      
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-5xl font-black text-white font-mono tracking-tighter">
                          {activeCarouselProject.progress}%
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                          PROGRESO
                        </span>
                      </div>
                    </div>

                    <Link 
                      href={`/proyectos/${activeCarouselProject.id}`}
                      className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30"
                    >
                      Abrir Expediente Completo
                    </Link>
                  </div>

                </div>

              </div>
            )
          ) : (

            /* ── MODO BENTO GRID (DEFAULT & CRITICAL) ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 md:gap-6">
              {displayedProjects.map(project => {
                const isAtorado = project.status === 'ATORADO';
                const isRiesgo = project.status === 'RIESGO';

                const statusColor = isAtorado ? 'text-rose-400' : isRiesgo ? 'text-amber-400' : 'text-blue-400';
                const statusBg = isAtorado ? 'bg-rose-500/10' : isRiesgo ? 'bg-amber-500/10' : 'bg-blue-500/10';
                const statusBorder = isAtorado ? 'border-rose-500/30' : isRiesgo ? 'border-amber-500/30' : 'border-blue-500/30';

                const allProjectTasks = project.departments?.flatMap(d => d.tasks || []) || [];
                const totalTasks = allProjectTasks.length;
                const pendingTasks = allProjectTasks.filter(t => t.status !== 'COMPLETADA').length;

                return (
                  <Link 
                    href={`/proyectos/${project.id}`} 
                    key={project.id} 
                    className={`group relative flex flex-col justify-between p-6 rounded-3xl bg-[#090d16] border border-white/[0.08] hover:border-white/20 transition-all duration-300 hover:shadow-2xl overflow-hidden ${
                      isAtorado ? 'hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]' : ''
                    }`}
                  >
                    {/* Status Top Strip */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                      isAtorado ? 'bg-gradient-to-r from-rose-600 to-red-400 animate-pulse' :
                      isRiesgo ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                      'bg-gradient-to-r from-blue-600 to-cyan-400'
                    }`} />

                    {/* Card Header */}
                    <div className="mb-4">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Factory className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[180px]">
                            {project.client.name}
                          </span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${statusBg} ${statusColor} ${statusBorder}`}>
                          {project.status}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                        {project.name}
                      </h3>
                    </div>

                    {/* Blocked Reason Banner */}
                    {isAtorado && project.blockReason && (
                      <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-extrabold uppercase tracking-widest text-rose-400">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Motivo de Bloqueo
                        </div>
                        <p className="text-xs line-clamp-2 leading-relaxed">{project.blockReason}</p>
                      </div>
                    )}

                    {/* Department Progress Micro Chips */}
                    {project.departments && project.departments.length > 0 && (
                      <div className="mb-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                        {project.departments.map(dept => (
                          <div key={dept.name} className="flex justify-between items-center text-[10px] bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span className="text-slate-400 font-semibold truncate">{dept.name}</span>
                            <span className="font-mono font-bold text-white">{dept.progress || 0}%</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer Progress Bar */}
                    <div className="mt-auto pt-3 border-t border-white/5">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                          {pendingTasks} tareas pendientes
                        </span>
                        <span className="text-2xl font-black text-white font-mono">{project.progress}%</span>
                      </div>
                      
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden p-0.5 border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            isAtorado ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' :
                            isRiesgo ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                            'bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                  </Link>
                );
              })}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
