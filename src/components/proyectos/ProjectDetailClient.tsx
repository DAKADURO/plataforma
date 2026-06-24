'use client';

import React, { useState, useTransition } from 'react';
import { updateProjectStatus } from '@/app/actions/projects';
import { createTask, updateTask, deleteTask } from '@/app/actions/tasks';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, XCircle,
  Users, Package, FileText, UploadCloud,
  ChevronDown, ChevronRight, Download, Clock,
  Save, Plus, Trash2, ListChecks, Calendar,
} from 'lucide-react';
import Link from 'next/link';
import UploadDocumentModal from './UploadDocumentModal';
import Card from '@/components/ui/Card';

// ---- Types ----
type DocumentVersion = {
  id: string;
  version: number;
  url: string;
  notes: string | null;
  uploadedBy: string;
  createdAt: Date;
};

type ProjectDocument = {
  id: string;
  name: string;
  type: string;
  versions: DocumentVersion[];
};

type InventoryItem = {
  id: string;
  quantity: number;
  date: Date;
  product: { name: string };
};

type ProjectTask = {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  status: string;
};

type Project = {
  id: string;
  name: string;
  status: string;
  blockReason: string | null;
  client: { name: string };
  inventory: InventoryItem[];
  documents: ProjectDocument[];
  tasks: ProjectTask[];
};

// ---- Helper ----
function toDateInput(d: Date | null): string {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
  PENDIENTE:    { label: 'Pendiente',   dot: 'bg-slate-400' },
  EN_PROGRESO:  { label: 'En progreso', dot: 'bg-amber-400' },
  COMPLETADA:   { label: 'Completada',  dot: 'bg-emerald-400' },
};

// ---- Sub-component: TaskRow ----
function TaskRow({
  task,
  projectId,
  role,
  onOptimisticUpdate,
  onOptimisticDelete,
}: {
  task: ProjectTask;
  projectId: string;
  role: string;
  onOptimisticUpdate: (id: string, patch: Partial<ProjectTask>) => void;
  onOptimisticDelete: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleProgressChange = (val: number) => {
    const newStatus = val === 100 ? 'COMPLETADA' : val > 0 ? 'EN_PROGRESO' : 'PENDIENTE';
    onOptimisticUpdate(task.id, { progress: val, status: newStatus });
    startTransition(async () => {
      await updateTask({ id: task.id, projectId, progress: val, status: newStatus });
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const date = value ? new Date(value) : null;
    onOptimisticUpdate(task.id, { [field]: date });
    startTransition(async () => {
      await updateTask({ id: task.id, projectId, [field]: date });
    });
  };

  const handleDelete = () => {
    onOptimisticDelete(task.id);
    startTransition(async () => {
      await deleteTask(task.id, projectId);
    });
  };

  const statusInfo = STATUS_MAP[task.status] ?? STATUS_MAP['PENDIENTE'];
  const isReadOnly = role === 'TECNICO';

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-center
        p-4 rounded-xl border transition-all
        ${isPending ? 'opacity-60' : ''}
        bg-white/5 border-white/10 hover:bg-white/8`}
    >
      {/* Task Name + Status */}
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo.dot}`} />
        <span className="font-medium text-sm text-white truncate">{task.name}</span>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Inicio</label>
        <input
          type="date"
          value={toDateInput(task.startDate)}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
          disabled={isReadOnly}
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5
            text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-40"
        />
      </div>

      {/* End Date */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Fin</label>
        <input
          type="date"
          value={toDateInput(task.endDate)}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
          disabled={isReadOnly}
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5
            text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-40"
        />
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase">
          <span>Progreso</span>
          <span className="text-white">{task.progress}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={task.progress}
          disabled={isReadOnly}
          onChange={(e) => handleProgressChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500 disabled:opacity-40"
        />
      </div>

      {/* Delete */}
      {!isReadOnly && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10
            transition-colors disabled:opacity-40"
          title="Eliminar tarea"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ---- Main Component ----
export default function ProjectDetailClient({ project, role }: { project: Project; role: string }) {
  const [status, setStatus] = useState(project.status);
  const [blockReason, setBlockReason] = useState(project.blockReason || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Task state (optimistic)
  const [tasks, setTasks] = useState<ProjectTask[]>(project.tasks);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');
  const [addingTask, startAddingTask] = useTransition();

  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<string[]>([]);

  // Compute progress from tasks
  const computedProgress = tasks.length === 0
    ? 0
    : Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length);

  const toggleDoc = (id: string) => {
    setExpandedDocs(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const handleSaveStatus = async () => {
    setSaving(true);
    setSaved(false);
    await updateProjectStatus({ id: project.id, status, blockReason });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    const optimisticTask: ProjectTask = {
      id: `tmp-${Date.now()}`,
      name: newTaskName.trim(),
      startDate: newTaskStart ? new Date(newTaskStart) : null,
      endDate: newTaskEnd ? new Date(newTaskEnd) : null,
      progress: 0,
      status: 'PENDIENTE',
    };
    setTasks(prev => [...prev, optimisticTask]);
    const name = newTaskName.trim();
    const start = newTaskStart ? new Date(newTaskStart) : null;
    const end = newTaskEnd ? new Date(newTaskEnd) : null;
    setNewTaskName('');
    setNewTaskStart('');
    setNewTaskEnd('');

    startAddingTask(async () => {
      const result = await createTask({
        projectId: project.id,
        name,
        startDate: start,
        endDate: end,
      });
      if (result.success && result.task) {
        setTasks(prev => prev.map(t => t.id === optimisticTask.id ? result.task as ProjectTask : t));
      }
    });
  };

  const handleOptimisticUpdate = (id: string, patch: Partial<ProjectTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const handleOptimisticDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <Link href="/proyectos" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-400 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver al Tablero
      </Link>

      {/* ── Project Header ── */}
      <div className="bg-[#151515] rounded-2xl border border-white/10 p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
          <div className="flex items-center gap-2 text-slate-400">
            <Users className="w-5 h-5" />
            <span className="font-medium text-lg">{project.client.name}</span>
          </div>
        </header>

        {/* ── Global Progress (read-only) ── */}
        <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-300">Progreso Global del Proyecto</span>
            <span className="text-sm font-bold text-blue-400">{computedProgress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-blue-500 transition-all duration-700"
              style={{ width: `${computedProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Calculado automáticamente como el promedio del progreso de las tareas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* ── Estado Operativo ── */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Estado Operativo</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'NORMAL', label: 'Normal', Icon: CheckCircle2, active: 'border-emerald-500 bg-emerald-500/10 text-emerald-400', idle: 'border-white/10 text-slate-500' },
                  { id: 'RIESGO', label: 'En Riesgo', Icon: AlertTriangle, active: 'border-amber-500 bg-amber-500/10 text-amber-400', idle: 'border-white/10 text-slate-500' },
                  { id: 'ATORADO', label: 'Atorado', Icon: XCircle, active: 'border-rose-500 bg-rose-500/10 text-rose-400', idle: 'border-white/10 text-slate-500' },
                ].map(({ id, label, Icon, active, idle }) => (
                  <button
                    key={id}
                    onClick={() => setStatus(id)}
                    disabled={role === 'TECNICO'}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                      ${role === 'TECNICO' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                      ${status === id ? active : idle} hover:border-opacity-60`}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {status === 'ATORADO' && role !== 'TECNICO' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Motivo del Bloqueo</label>
                <textarea
                  rows={2}
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="Explica brevemente por qué el proyecto está atorado..."
                  className="block w-full rounded-xl border border-white/10 bg-[#1a1a1a] text-white p-3 text-sm
                    focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
            )}
            {status === 'ATORADO' && role === 'TECNICO' && blockReason && (
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/30">
                <label className="block text-sm font-bold text-rose-400 mb-1">Motivo del Bloqueo</label>
                <p className="text-sm text-rose-300">{blockReason}</p>
              </div>
            )}

            {role !== 'TECNICO' && (
              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={handleSaveStatus}
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 rounded-xl bg-white text-slate-900
                    py-3 px-4 text-sm font-bold shadow-sm hover:bg-slate-100 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : <><Save className="w-4 h-4" /> Guardar Estado</>}
                </button>
                {saved && <span className="text-emerald-400 font-medium text-sm animate-pulse">¡Actualizado!</span>}
              </div>
            )}
          </div>

          {/* ── Consumo de Almacén ── */}
          <div className="space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-400" />
              Consumo de Almacén
            </h3>
            {project.inventory.length === 0 ? (
              <p className="text-sm text-slate-500">No se han registrado materiales para este proyecto.</p>
            ) : (
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                {project.inventory.map(inv => (
                  <Card key={inv.id} className="p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-xs text-slate-200">{inv.product.name}</span>
                      <span className="text-[10px] text-slate-500">{new Date(inv.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-300">{inv.quantity} und.</div>
                  </Card>
                ))}
              </div>
            )}
            <div className="pt-2 border-t border-white/5 text-center">
              <Link href="/almacen" className="text-sm font-semibold text-blue-400 hover:underline">
                Vincular más materiales desde Almacén →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── PLAN DE TRABAJO (TAREAS DINÁMICAS) ── */}
      <div className="bg-[#151515] rounded-2xl border border-white/10 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <ListChecks className="w-6 h-6 text-blue-400" />
            Plan de Trabajo
          </h2>
          <span className="text-sm text-slate-500">{tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}</span>
        </div>

        {/* Add Task Row */}
        {role !== 'TECNICO' && (
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 mb-4
            p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nombre de la tarea</label>
              <input
                type="text"
                placeholder="ej. Instalación eléctrica panel A"
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2
                  text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Inicio
              </label>
              <input
                type="date"
                value={newTaskStart}
                onChange={e => setNewTaskStart(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-2
                  text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Fin estimado
              </label>
              <input
                type="date"
                value={newTaskEnd}
                onChange={e => setNewTaskEnd(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-2
                  text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddTask}
                disabled={!newTaskName.trim() || addingTask}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500
                  text-white text-sm font-bold rounded-lg transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
          </div>
        )}

        {/* Task List */}
        {tasks.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-white/10 rounded-2xl">
            <ListChecks className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Sin tareas aún.</p>
            <p className="text-sm text-slate-600 mt-1">Agrega la primera tarea del plan de trabajo.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                projectId={project.id}
                role={role}
                onOptimisticUpdate={handleOptimisticUpdate}
                onOptimisticDelete={handleOptimisticDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── GESTOR DOCUMENTAL (DMS) ── */}
      <div className="bg-[#151515] rounded-2xl border border-white/10 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            Documentos Técnicos (DMS)
          </h2>
          <button
            onClick={() => setDocumentModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg
              text-sm font-medium hover:bg-blue-500 transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Subir Documento
          </button>
        </div>

        {(!project.documents || project.documents.length === 0) ? (
          <div className="text-center p-12 border-2 border-dashed border-white/10 rounded-2xl">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay documentos técnicos subidos.</p>
            <p className="text-sm text-slate-600 mt-1">Sube el primer plano o documento para empezar.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.documents.map(doc => {
              const latestVersion = doc.versions[0];
              const isExpanded = expandedDocs.includes(doc.id);
              return (
                <Card key={doc.id} className="p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={() => toggleDoc(doc.id)} className="flex items-center gap-1 text-slate-400 hover:text-blue-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span className="font-medium text-sm text-white">{doc.name}</span>
                    </button>
                    <span className="uppercase text-xs font-bold text-slate-500">{doc.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-semibold border border-blue-500/20 text-xs">
                      v{latestVersion?.version}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {latestVersion ? new Date(latestVersion.createdAt).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  {latestVersion?.url && (
                    <a href={latestVersion.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300
                        font-medium text-xs bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors">
                      <Download className="w-3.5 h-3.5" /> Descargar
                    </a>
                  )}
                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Historial de Versiones</h4>
                      {doc.versions.map(v => (
                        <Card key={v.id} className="p-3 border border-white/10 bg-[#1a1a1a]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded text-xs">v{v.version}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(v.createdAt).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500 border-l border-white/10 pl-2 ml-1">por {v.uploadedBy}</span>
                          </div>
                          <p className="text-sm text-slate-400">{v.notes || <span className="italic text-slate-600">Sin notas adicionales</span>}</p>
                          <a href={v.url} target="_blank" rel="noopener noreferrer"
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors inline-block mt-2">
                            <Download className="w-4 h-4" />
                          </a>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <UploadDocumentModal isOpen={isDocumentModalOpen} onClose={() => setDocumentModalOpen(false)} projectId={project.id} />
    </div>
  );
}
