/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useTransition, useRef } from 'react';
import { updateProjectStatus, updateProjectBudget } from '@/app/actions/projects';
import { addProjectNote } from '@/app/actions/projects';
import { createTask, updateTask, deleteTask, addTaskMaterial, removeTaskMaterial, addTaskChecklistItem, removeTaskChecklistItem, toggleTaskChecklistItem } from '@/app/actions/tasks';
import { addWorkLog, deleteWorkLog } from '@/app/actions/worklogs';
import { updateProjectContractAmount } from '@/app/actions/projects';
import { addPayment, markPaymentPaid, markPaymentPending, deletePayment } from '@/app/actions/payments';
import {
  ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, XCircle,
  Users, Package, FileText, UploadCloud,
  ChevronDown, ChevronRight, Download, Clock,
  Save, Plus, Trash2, ListChecks, Calendar, MessageSquare, Send, Truck, Receipt, CircleCheck,
  Lock, ShieldAlert, Activity, FileCode, Link2,
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
  folder: string;
  versions: DocumentVersion[];
};

type InventoryItem = {
  id: string;
  quantity: number;
  date: Date;
  product: { name: string; cost: number };
};

type TaskMaterial = {
  id: string;
  quantity: number;
  consumed: boolean;
  product: { id: string; name: string; sku: string };
};

type TaskChecklistItem = {
  id: string;
  description: string;
  isCompleted: boolean;
};

type ProjectTask = {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  status: string;
  dependsOnTaskId?: string | null;
  dependsOnTask?: { id: string; name: string; progress: number } | null;
  materials: TaskMaterial[];
  checklists?: TaskChecklistItem[];
};

type Product = { id: string; name: string; sku: string; stock: number };

type ProjectDepartment = {
  id: string;
  name: string;
  progress: number;
  status: string;
  tasks: ProjectTask[];
};

type ProjectNote = {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
};

type WorkLog = {
  id: string;
  date: Date;
  hours: number;
  description: string | null;
  hourlyCostSnapshot: number;
  user: { email: string };
};

type MachineAssignment = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  dailyRateSnapshot: number;
  machine: { id: string; name: string; category: string };
};

type ProjectPayment = {
  id: string;
  concept: string;
  amount: number;
  status: string;
  dueDate: Date | null;
  paidDate: Date | null;
  notes: string | null;
};

type ProjectStatusEvent = {
  id: string;
  status: string;
  category: string | null;
  reason: string | null;
  createdAt: Date;
  userId?: string | null;
};

type AuditLogItem = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: Date;
  user?: { email: string } | null;
};

type Project = {
  id: string;
  name: string;
  status: string;
  blockReason: string | null;
  budget: number;
  contractAmount: number;
  client: { name: string };
  team: { id: string; email: string; role: string }[];
  inventory: InventoryItem[];
  documents: ProjectDocument[];
  departments: ProjectDepartment[];
  notes: ProjectNote[];
  workLogs: WorkLog[];
  machineAssignments: MachineAssignment[];
  payments: ProjectPayment[];
  statusEvents?: ProjectStatusEvent[];
  auditLogs?: AuditLogItem[];
};

// Las fechas de inicio/fin vienen de <input type="date"> y se guardan como medianoche UTC;
// comparamos por fecha calendario en UTC para no perder/ganar un día según la zona horaria local.
function daysBetween(start: Date, end: Date): number {
  const s = new Date(start);
  const e = new Date(end);
  const sUTC = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  const eUTC = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
  return Math.max(1, Math.round((eUTC - sUTC) / (1000 * 60 * 60 * 24)) + 1);
}

function formatDateOnly(d: Date): string {
  return new Date(d).toLocaleDateString('es-MX', { timeZone: 'UTC' });
}

// ---- Helper ----
function toDateInput(d: Date | null): string {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
  PENDIENTE:   { label: 'Pendiente',   dot: 'bg-slate-400' },
  EN_PROGRESO: { label: 'En progreso', dot: 'bg-amber-400' },
  COMPLETADA:  { label: 'Completada',  dot: 'bg-emerald-400' },
};

// ---- Sub-component: TaskRow ----
function TaskRow({
  task,
  projectId,
  departmentId,
  role,
  products,
  allProjectTasks = [],
  onOptimisticUpdate,
  onOptimisticDelete,
}: {
  task: ProjectTask;
  projectId: string;
  departmentId: string;
  role: string;
  products: Product[];
  allProjectTasks?: ProjectTask[];
  onOptimisticUpdate: (id: string, patch: Partial<ProjectTask>) => void;
  onOptimisticDelete: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showMaterials, setShowMaterials] = useState(false);
  const [showChecklists, setShowChecklists] = useState(false);
  const [materials, setMaterials] = useState<TaskMaterial[]>(task.materials || []);
  const [checklists, setChecklists] = useState<TaskChecklistItem[]>(task.checklists || []);
  const [newChecklistDesc, setNewChecklistDesc] = useState('');
  const [savingChecklist, startSavingChecklist] = useTransition();
  
  const [newMaterialProductId, setNewMaterialProductId] = useState('');
  const [newMaterialQty, setNewMaterialQty] = useState('');
  const [materialError, setMaterialError] = useState('');
  const [taskError, setTaskError] = useState('');
  const [savingMaterial, startSavingMaterial] = useTransition();

  const predecessor = task.dependsOnTask || allProjectTasks.find(t => t.id === task.dependsOnTaskId);
  const isBlocked = predecessor ? (predecessor.progress < 100) : false;

  const handleAddMaterial = () => {
    const quantity = Number(newMaterialQty);
    if (!newMaterialProductId || !Number.isFinite(quantity) || quantity <= 0) {
      setMaterialError('Selecciona un producto y una cantidad válida.');
      return;
    }
    setMaterialError('');
    startSavingMaterial(async () => {
      const result = await addTaskMaterial({ taskId: task.id, productId: newMaterialProductId, quantity, projectId });
      if (result.success && result.material) {
        setMaterials(prev => [...prev, result.material as TaskMaterial]);
        setNewMaterialProductId('');
        setNewMaterialQty('');
      } else {
        setMaterialError(result.error || 'No se pudo vincular el material.');
      }
    });
  };

  const handleRemoveMaterial = (materialId: string) => {
    startSavingMaterial(async () => {
      const result = await removeTaskMaterial(materialId, projectId);
      if (result.success) {
        setMaterials(prev => prev.filter(m => m.id !== materialId));
      } else {
        setMaterialError(result.error || 'No se pudo quitar el material.');
      }
    });
  };

  const handleProgressChange = (val: number) => {
    setTaskError('');
    if (isBlocked && val > 0) {
      setTaskError(`No se puede iniciar: depende de "${predecessor?.name}" que aún no está completada.`);
      return;
    }
    if (val === 100 && checklists.some(c => !c.isCompleted)) {
      setTaskError('Debes completar el checklist de calidad antes de cerrar la tarea.');
      return;
    }
    const newStatus = val === 100 ? 'COMPLETADA' : val > 0 ? 'EN_PROGRESO' : 'PENDIENTE';
    onOptimisticUpdate(task.id, { progress: val, status: newStatus });
    if (val === 100) {
      setMaterials(prev => prev.map(m => ({ ...m, consumed: true })));
    }
    startTransition(async () => {
      const res = await updateTask({ id: task.id, projectId, projectDepartmentId: departmentId, progress: val, status: newStatus });
      if (!res.success) {
        setTaskError(res.error || 'Error al actualizar el avance');
        // Revert UI if server blocked it (e.g. checklists not checked on server)
        if (res.error?.includes('calidad') && val === 100) {
           onOptimisticUpdate(task.id, { progress: task.progress, status: task.status });
        }
      }
    });
  };

  const handleAddChecklist = () => {
    if (!newChecklistDesc.trim()) return;
    startSavingChecklist(async () => {
      const result = await addTaskChecklistItem({ taskId: task.id, description: newChecklistDesc, projectId });
      if (result.success && result.item) {
        setChecklists(prev => [...prev, result.item as TaskChecklistItem]);
        setNewChecklistDesc('');
      } else {
        setTaskError(result.error || 'Error al guardar item.');
      }
    });
  };

  const handleToggleChecklist = (item: TaskChecklistItem) => {
    const nextVal = !item.isCompleted;
    setChecklists(prev => prev.map(c => c.id === item.id ? { ...c, isCompleted: nextVal } : c));
    startSavingChecklist(async () => {
      const res = await toggleTaskChecklistItem(item.id, nextVal, projectId);
      if (!res.success) {
        setTaskError(res.error || 'Error al actualizar item.');
        setChecklists(prev => prev.map(c => c.id === item.id ? { ...c, isCompleted: !nextVal } : c));
      }
    });
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklists(prev => prev.filter(c => c.id !== id));
    startSavingChecklist(async () => {
      await removeTaskChecklistItem(id, projectId);
    });
  };

  const handlePredecessorChange = (dependsOnTaskId: string) => {
    setTaskError('');
    const targetId = dependsOnTaskId || null;
    const selectedPred = allProjectTasks.find(t => t.id === targetId);
    onOptimisticUpdate(task.id, { dependsOnTaskId: targetId, dependsOnTask: selectedPred ? { id: selectedPred.id, name: selectedPred.name, progress: selectedPred.progress } : null });
    startTransition(async () => {
      const res = await updateTask({ id: task.id, projectId, projectDepartmentId: departmentId, dependsOnTaskId: targetId });
      if (!res.success) {
        setTaskError(res.error || 'No se pudo actualizar la dependencia');
      }
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const date = value ? new Date(value) : null;
    onOptimisticUpdate(task.id, { [field]: date });
    startTransition(async () => {
      await updateTask({ id: task.id, projectId, projectDepartmentId: departmentId, [field]: date });
    });
  };

  const handleDelete = () => {
    onOptimisticDelete(task.id);
    startTransition(async () => {
      await deleteTask(task.id, projectId, departmentId);
    });
  };

  const statusInfo = STATUS_MAP[task.status] ?? STATUS_MAP['PENDIENTE'];
  const isReadOnly = role === 'TECNICO';

  const statusIconStyle =
    task.status === 'COMPLETADA' ? { background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' }
    : task.status === 'EN_PROGRESO' ? { background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning)' }
    : { background: 'var(--bg-surface-alt)', color: 'var(--text-muted)', border: '1px solid var(--border)' };

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    padding: '6px 8px',
    fontSize: '0.75rem',
    color: 'var(--text-primary)',
    outline: 'none',
    opacity: isReadOnly ? 0.4 : 1,
  } as const;

  return (
    <div
      className="rounded-2xl border transition-all duration-300"
      style={{ background: 'var(--bg-surface)', borderColor: isBlocked ? 'var(--warning)' : 'var(--border)', opacity: isPending ? 0.6 : 1 }}
    >
      {taskError && (
        <div className="px-4 pt-3 text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--danger)' }}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {taskError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1.2fr_auto_auto] gap-3 items-center p-4">
        {/* Task Name + Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg" style={statusIconStyle}>
            {isBlocked ? <Lock className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm block line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                {task.name}
              </span>
              {isBlocked && (
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border bg-amber-500/10 text-amber-500 border-amber-500/20" title={`Bloqueada por ${predecessor?.name} (avance < 100%)`}>
                  Bloqueada
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {statusInfo.label} {predecessor ? `· Predecesora: ${predecessor.name}` : ''}
            </span>
          </div>
        </div>

        {/* Predecessor Dropdown */}
        <div>
          <label className="block text-[10px] font-bold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Predecesora</label>
          <select
            value={task.dependsOnTaskId || ''}
            onChange={e => handlePredecessorChange(e.target.value)}
            disabled={isReadOnly}
            style={inputStyle}
          >
            <option value="">(Ninguna)</option>
            {allProjectTasks
              .filter(t => t.id !== task.id)
              .map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.progress}%)
                </option>
              ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[10px] font-bold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Inicio</label>
          <input
            type="date"
            value={toDateInput(task.startDate)}
            onChange={e => handleDateChange('startDate', e.target.value)}
            disabled={isReadOnly}
            style={inputStyle}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[10px] font-bold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Fin</label>
          <input
            type="date"
            value={toDateInput(task.endDate)}
            onChange={e => handleDateChange('endDate', e.target.value)}
            disabled={isReadOnly}
            style={inputStyle}
          />
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              Progreso {isBlocked && <Lock className="w-3 h-3 text-amber-500" />}
            </span>
            <span style={{ color: 'var(--text-primary)' }}>{task.progress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={task.progress}
            disabled={isReadOnly || isBlocked}
            title={isBlocked ? `Bloqueada por "${predecessor?.name}" (avance < 100%)` : ''}
            onChange={e => handleProgressChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-40"
            style={{ accentColor: 'var(--accent)' }}
          />
        </div>

        {/* Checklists y Materiales */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowChecklists(v => { setShowMaterials(false); return !v; })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={checklists.length > 0
              ? (checklists.every(c => c.isCompleted) ? { background: 'var(--success-bg)', color: 'var(--success)' } : { background: 'var(--warning-bg)', color: 'var(--warning)' })
              : { background: 'var(--bg-surface-alt)', color: 'var(--text-muted)' }
            }
            title="Control de Calidad"
          >
            <ListChecks className="w-3.5 h-3.5" />
            {checklists.length > 0 ? `${checklists.filter(c => c.isCompleted).length}/${checklists.length}` : ''}
          </button>
          
          <button
            onClick={() => setShowMaterials(v => { setShowChecklists(false); return !v; })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={materials.length > 0
              ? { background: 'var(--accent-subtle)', color: 'var(--accent)' }
              : { background: 'var(--bg-surface-alt)', color: 'var(--text-muted)' }
            }
            title="Materiales de esta tarea"
          >
            <Package className="w-3.5 h-3.5" />
            {materials.length > 0 ? materials.length : ''}
          </button>
        </div>

        {/* Delete */}
        {!isReadOnly && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 rounded-lg transition-colors disabled:opacity-40"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = 'var(--danger)';
              el.style.background = 'var(--danger-bg)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = 'var(--text-muted)';
              el.style.background = '';
            }}
            title="Eliminar tarea"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {showChecklists && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {!isReadOnly && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nuevo punto a revisar..."
                value={newChecklistDesc}
                onChange={e => setNewChecklistDesc(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddChecklist(); }}
                className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleAddChecklist}
                disabled={!newChecklistDesc.trim() || savingChecklist}
                className="px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                Agregar
              </button>
            </div>
          )}
          {checklists.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin items de calidad para esta tarea.</p>
          ) : (
            <div className="space-y-1.5">
              {checklists.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--bg-surface-alt)' }}
                >
                  <label className="flex items-center gap-3 cursor-pointer select-none min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={c.isCompleted}
                      onChange={() => handleToggleChecklist(c)}
                      disabled={savingChecklist || (isReadOnly && !c.isCompleted)}
                      className="w-4 h-4 rounded shrink-0 cursor-pointer disabled:cursor-not-allowed"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span className="text-xs" style={{ 
                      color: c.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', 
                      textDecoration: c.isCompleted ? 'line-through' : 'none' 
                    }}>
                      {c.description}
                    </span>
                  </label>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleRemoveChecklist(c.id)}
                      disabled={savingChecklist}
                      className="p-1 shrink-0 rounded transition-colors disabled:opacity-40"
                      style={{ color: 'var(--text-muted)' }}
                      title="Quitar item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showMaterials && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {!isReadOnly && (
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2">
              <select
                value={newMaterialProductId}
                onChange={e => setNewMaterialProductId(e.target.value)}
                className="rounded-lg px-3 py-2 text-xs outline-none"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="">Selecciona un producto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku}, stock: {p.stock})</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Cantidad"
                value={newMaterialQty}
                onChange={e => setNewMaterialQty(e.target.value)}
                className="rounded-lg px-3 py-2 text-xs outline-none"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleAddMaterial}
                disabled={!newMaterialProductId || !newMaterialQty || savingMaterial}
                className="px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                Vincular
              </button>
            </div>
          )}
          {materialError && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{materialError}</p>}
          {materials.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin materiales vinculados a esta tarea.</p>
          ) : (
            <div className="space-y-1.5">
              {materials.map(m => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--bg-surface-alt)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {m.product.name} <span style={{ color: 'var(--text-muted)' }}>· SKU {m.product.sku} · Cant: {m.quantity}</span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.consumed && (
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        Descontado
                      </span>
                    )}
                    {!isReadOnly && !m.consumed && (
                      <button
                        onClick={() => handleRemoveMaterial(m.id)}
                        disabled={savingMaterial}
                        className="p-1 rounded transition-colors disabled:opacity-40"
                        style={{ color: 'var(--text-muted)' }}
                        title="Quitar material"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Al llegar la tarea a 100% de progreso, estos materiales se descuentan automáticamente del almacén.
          </p>
        </div>
      )}
    </div>
  );
}

// ---- Main Component ----
export default function ProjectDetailClient({ project, role, products = [] }: { project: Project; role: string; products?: Product[] }) {
  const [status, setStatus] = useState(project.status);
  const [blockReason, setBlockReason] = useState(project.blockReason || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Main View Navigation Tabs
  const [activeTab, setActiveTab] = useState<'PLAN' | 'FINANCIERO' | 'HORAS_EQUIPOS' | 'DOCUMENTOS' | 'ACTIVIDAD'>('PLAN');
  const [statusCategory, setStatusCategory] = useState('Falta de suministro');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);

  const [budget, setBudget] = useState(project.budget || 0);
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  const [workLogs, setWorkLogs] = useState<WorkLog[]>(project.workLogs || []);
  const [newLogDate, setNewLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newLogHours, setNewLogHours] = useState('');
  const [newLogDesc, setNewLogDesc] = useState('');
  const [addingLog, startAddingLog] = useTransition();
  const [logError, setLogError] = useState('');

  // Los montos de mano de obra son confidenciales: solo ADMIN/GERENTE los ven
  const canSeeMoney = role !== 'TECNICO';
  const materialCost = project.inventory.reduce((sum, inv) => sum + inv.quantity * (inv.product?.cost || 0), 0);
  const laborCost = workLogs.reduce((sum, w) => sum + w.hours * w.hourlyCostSnapshot, 0);
  const totalHours = workLogs.reduce((sum, w) => sum + w.hours, 0);
  const machineCost = (project.machineAssignments || []).reduce(
    (sum, a) => sum + daysBetween(a.startDate, a.endDate || new Date()) * a.dailyRateSnapshot, 0
  );
  const totalCost = materialCost + machineCost + (canSeeMoney ? laborCost : 0);
  const remainingBudget = budget - totalCost;
  const isOverBudget = remainingBudget < 0;

  const [contractAmount, setContractAmount] = useState(project.contractAmount || 0);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [savingContract, startSavingContract] = useTransition();
  const [payments, setPayments] = useState<ProjectPayment[]>(project.payments || []);
  const [newPaymentConcept, setNewPaymentConcept] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDueDate, setNewPaymentDueDate] = useState('');
  const [addingPayment, startAddingPayment] = useTransition();
  const [paymentError, setPaymentError] = useState('');

  const totalPaid = payments.filter(p => p.status === 'PAGADO').reduce((sum, p) => sum + p.amount, 0);
  const totalPendingCollection = payments.filter(p => p.status === 'PENDIENTE').reduce((sum, p) => sum + p.amount, 0);
  const uncontractedBalance = contractAmount - (totalPaid + totalPendingCollection);

  // Margen bruto: solo tiene sentido si hay un monto contratado; con costos de mano de
  // obra ocultos para TECNICO, el margen mostrado a ese rol sería engañoso, así que
  // también se restringe a canSeeMoney (definida arriba).
  const grossMargin = contractAmount > 0 ? ((contractAmount - totalCost) / contractAmount) * 100 : null;

  const [departments, setDepartments] = useState<ProjectDepartment[]>(project.departments || []);
  const [activeDeptId, setActiveDeptId] = useState<string>(project.departments?.[0]?.id || '');

  const activeDept = departments.find(d => d.id === activeDeptId);
  const tasks = activeDept?.tasks || [];
  const allProjectTasks = departments.flatMap(d => d.tasks);

  // Contador para ids temporales optimistas: evita usar Date.now() (impuro para el compilador de React).
  const tempIdCounter = useRef(0);

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');
  const [newTaskPredecessor, setNewTaskPredecessor] = useState('');
  const [addingTask, startAddingTask] = useTransition();
  const [viewMode, setViewMode] = useState<'LISTA' | 'GANTT'>('LISTA');

  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<string[]>([]);

  const [notes, setNotes] = useState<ProjectNote[]>(project.notes || []);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const computedProgress =
    departments.length === 0
      ? 0
      : Math.round(departments.reduce((s, d) => s + d.progress, 0) / departments.length);

  const toggleDoc = (id: string) => {
    setExpandedDocs(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const handleSelectStatus = (newStatus: string) => {
    if (newStatus === 'RIESGO' || newStatus === 'ATORADO') {
      setPendingStatusChange(newStatus);
      setIsStatusModalOpen(true);
    } else {
      setStatus(newStatus);
      setPendingStatusChange(null);
      handleSaveStatusDirect('NORMAL');
    }
  };

  const handleSaveStatusDirect = async (newStatus: string) => {
    setSaving(true);
    setSaved(false);
    await updateProjectStatus({ id: project.id, status: newStatus });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveStatusModal = async () => {
    if (!pendingStatusChange) return;
    setSaving(true);
    const result = await updateProjectStatus({
      id: project.id,
      status: pendingStatusChange,
      category: statusCategory,
      reason: blockReason || null,
    });
    setSaving(false);
    if (result.success) {
      setStatus(pendingStatusChange);
      setIsStatusModalOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleSaveBudget = async () => {
    await updateProjectBudget(project.id, budget);
    setIsEditingBudget(false);
  };

  const handleAddTask = () => {
    if (!newTaskName.trim() || !activeDeptId) return;
    const predTask = allProjectTasks.find(t => t.id === newTaskPredecessor);
    const optimisticTask: ProjectTask = {
      id: `tmp-${++tempIdCounter.current}`,
      name: newTaskName.trim(),
      startDate: newTaskStart ? new Date(newTaskStart) : null,
      endDate: newTaskEnd ? new Date(newTaskEnd) : null,
      progress: 0,
      status: 'PENDIENTE',
      dependsOnTaskId: newTaskPredecessor || null,
      dependsOnTask: predTask ? { id: predTask.id, name: predTask.name, progress: predTask.progress } : null,
      materials: [],
    };
    setDepartments(prev => prev.map(d => d.id === activeDeptId ? { ...d, tasks: [...d.tasks, optimisticTask] } : d));
    const name = newTaskName.trim();
    const start = newTaskStart ? new Date(newTaskStart) : null;
    const end = newTaskEnd ? new Date(newTaskEnd) : null;
    const dependsOn = newTaskPredecessor || null;
    setNewTaskName('');
    setNewTaskStart('');
    setNewTaskEnd('');
    setNewTaskPredecessor('');

    startAddingTask(async () => {
      const result = await createTask({
        projectId: project.id,
        projectDepartmentId: activeDeptId,
        name,
        startDate: start,
        endDate: end,
        dependsOnTaskId: dependsOn,
      });
      if (result.success && result.task) {
        setDepartments(prev =>
          prev.map(d => d.id === activeDeptId
            ? { ...d, tasks: d.tasks.map(t => t.id === optimisticTask.id ? { ...result.task, materials: [] } as ProjectTask : t) }
            : d,
          ),
        );
      }
    });
  };

  const handleOptimisticUpdate = (id: string, patch: Partial<ProjectTask>) => {
    setDepartments(prev =>
      prev.map(d => ({
        ...d,
        tasks: d.tasks.map(t => t.id === id ? { ...t, ...patch } : t)
      })),
    );
  };

  const handleOptimisticDelete = (id: string) => {
    setDepartments(prev =>
      prev.map(d => ({
        ...d,
        tasks: d.tasks.filter(t => t.id !== id)
      })),
    );
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || addingNote) return;
    setAddingNote(true);
    const optimisticNote: ProjectNote = {
      id: `tmp-${Date.now()}`,
      content: newNote.trim(),
      author: 'Tú',
      createdAt: new Date(),
    };
    setNotes(prev => [optimisticNote, ...prev]);
    const contentToSend = newNote.trim();
    setNewNote('');
    await addProjectNote(project.id, contentToSend, 'Usuario');
    setAddingNote(false);
  };

  const handleAddWorkLog = () => {
    const hours = Number(newLogHours);
    if (!newLogDate || !Number.isFinite(hours) || hours <= 0) {
      setLogError('Indica una fecha y horas válidas (mayores a cero).');
      return;
    }
    setLogError('');
    const desc = newLogDesc.trim();
    startAddingLog(async () => {
      const result = await addWorkLog({ projectId: project.id, date: newLogDate, hours, description: desc || undefined });
      if (result.success && result.workLog) {
        setWorkLogs(prev => [result.workLog as WorkLog, ...prev]);
        setNewLogHours('');
        setNewLogDesc('');
      } else {
        setLogError(result.error || 'No se pudo registrar.');
      }
    });
  };

  const handleDeleteWorkLog = (id: string) => {
    setWorkLogs(prev => prev.filter(w => w.id !== id));
    startAddingLog(async () => {
      await deleteWorkLog(id, project.id);
    });
  };

  const handleSaveContract = () => {
    startSavingContract(async () => {
      await updateProjectContractAmount(project.id, contractAmount);
      setIsEditingContract(false);
    });
  };

  const handleAddPayment = () => {
    const amount = Number(newPaymentAmount);
    if (!newPaymentConcept.trim() || !Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Indica un concepto y un monto válido (mayor a cero).');
      return;
    }
    setPaymentError('');
    const concept = newPaymentConcept.trim();
    startAddingPayment(async () => {
      const result = await addPayment({ projectId: project.id, concept, amount, dueDate: newPaymentDueDate || undefined });
      if (result.success && result.payment) {
        setPayments(prev => [result.payment as ProjectPayment, ...prev]);
        setNewPaymentConcept('');
        setNewPaymentAmount('');
        setNewPaymentDueDate('');
      } else {
        setPaymentError(result.error || 'No se pudo registrar.');
      }
    });
  };

  const handleTogglePaymentStatus = (payment: ProjectPayment) => {
    const nextStatus = payment.status === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
    setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: nextStatus, paidDate: nextStatus === 'PAGADO' ? new Date() : null } : p));
    startAddingPayment(async () => {
      if (nextStatus === 'PAGADO') {
        await markPaymentPaid(payment.id, project.id);
      } else {
        await markPaymentPending(payment.id, project.id);
      }
    });
  };

  const handleDeletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    startAddingPayment(async () => {
      await deletePayment(id, project.id);
    });
  };

  // Activity Feed Assembly (Phase 7)
  const activityFeed = [
    ...(project.statusEvents || []).map(e => ({
      id: e.id,
      type: 'STATUS_EVENT' as const,
      title: `Estado cambiado a ${e.status === 'ATORADO' ? 'Atorado 🛑' : e.status === 'RIESGO' ? 'En Riesgo ⚠️' : 'Normal ✅'}`,
      category: e.category,
      details: e.reason,
      date: new Date(e.createdAt),
      user: e.userId || 'Sistema',
    })),
    ...(project.auditLogs || []).map(a => {
      let parsedDetails = a.details;
      try {
        if (a.details) {
          const json = JSON.parse(a.details);
          if (json.documentName) parsedDetails = `Documento "${json.documentName}" (v${json.version})`;
          else if (json.budget) parsedDetails = `Presupuesto actualizado a $${json.budget.toLocaleString()}`;
          else if (json.contractAmount) parsedDetails = `Monto contratado actualizado a $${json.contractAmount.toLocaleString()}`;
          else if (json.name) parsedDetails = `Proyecto "${json.name}"`;
        }
      } catch (_) {}
      return {
        id: a.id,
        type: 'AUDIT_LOG' as const,
        title: a.action === 'UPLOAD_DOCUMENT' ? 'Documento técnico subido'
          : a.action === 'UPDATE_BUDGET' ? 'Presupuesto modificado'
          : a.action === 'UPDATE_CONTRACT_AMOUNT' ? 'Monto contratado modificado'
          : a.action === 'STATUS_CHANGE' ? 'Cambio de estado'
          : a.action === 'CREATE_PROJECT' ? 'Proyecto creado'
          : a.action,
        category: null,
        details: parsedDetails,
        date: new Date(a.createdAt),
        user: a.user?.email || 'Usuario',
      };
    }),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const sectionStyle = { background: 'var(--bg-surface)', borderColor: 'var(--border)' };
  const inputFieldStyle = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '0.5rem',
    padding: '6px 8px',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
  } as const;

  return (
    <div className="space-y-6">
      <Link
        href="/proyectos"
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al Tablero
      </Link>

      {/* ── Project Header ── */}
      <div className="rounded-2xl border p-6 md:p-10 mb-8" style={sectionStyle}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-8">
            <header>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5 border"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {project.client.name.charAt(0).toUpperCase()}
                </div>
                <span>Cliente: <strong style={{ color: 'var(--text-primary)' }}>{project.client.name}</strong></span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                {project.name}
              </h1>

              {project.team && project.team.length > 0 && (
                <div className="flex items-center gap-2 mt-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest mr-2" style={{ color: 'var(--text-muted)' }}>
                    Equipo Asignado:
                  </span>
                  <div className="flex items-center">
                    {project.team.map(member => (
                      <div
                        key={member.id}
                        title={`${member.email} - ${member.role}`}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 -ml-3 first:ml-0 hover:z-10 relative hover:scale-110 transition-all cursor-help"
                        style={{ background: 'var(--accent)', borderColor: 'var(--bg-surface)' }}
                      >
                        {member.email.substring(0, 2).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </header>

            {/* Global Progress */}
            <div className="max-w-xl">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Progreso Global
                </span>
                <span className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{computedProgress}%</span>
              </div>
              <div
                className="w-full rounded-full h-4 overflow-hidden border"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${computedProgress}%`, background: 'var(--accent)' }}
                />
              </div>
              <p className="text-[10px] mt-3 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                Promedio calculado de tareas activas.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l pt-8 lg:pt-0 lg:pl-8 flex flex-col justify-center" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              Métricas Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: allProjectTasks.length,                                   label: 'Tareas Total', labelColor: 'var(--text-muted)' },
                { value: allProjectTasks.filter(t => t.status === 'COMPLETADA').length, label: 'Hechas',       labelColor: 'var(--success)' },
              ].map(({ value, label, labelColor }) => (
                <div
                  key={label}
                  className="p-5 rounded-2xl border transition-colors"
                  style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                >
                  <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</div>
                  <div className="text-[10px] font-bold uppercase" style={{ color: labelColor }}>{label}</div>
                </div>
              ))}
              <div
                className="col-span-2 p-5 rounded-2xl border flex justify-between items-center transition-colors"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Estado Operativo</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{STATUS_MAP[status]?.label || 'Desconocido'}</div>
                </div>
                <span className={`w-3 h-3 rounded-full animate-pulse ${STATUS_MAP[status]?.dot || 'bg-slate-500'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main View Tabs ── */}
      <div className="flex items-center gap-2 border-b overflow-x-auto scrollbar-hide pb-1" style={{ borderColor: 'var(--border)' }}>
        {[
          { id: 'PLAN',          label: 'Plan de Trabajo',           icon: ListChecks },
          { id: 'FINANCIERO',     label: 'Financiero & Cobros',        icon: Receipt },
          { id: 'HORAS_EQUIPOS', label: 'Horas & Equipos',           icon: Clock },
          { id: 'DOCUMENTOS',     label: `Documentos & Notas (${(project.documents?.length || 0) + notes.length})`, icon: FileText },
          { id: 'ACTIVIDAD',      label: `Actividad (${activityFeed.length})`, icon: Activity },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0 border"
            style={activeTab === id
              ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
              : { background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: PLAN DE TRABAJO ── */}
      {activeTab === 'PLAN' && (
        <div className="rounded-2xl border p-6 md:p-8" style={sectionStyle}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <ListChecks className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              Plan de Trabajo y Tareas
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm hidden sm:inline-block" style={{ color: 'var(--text-muted)' }}>
                {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
              </span>
              <div className="flex p-1 rounded-lg border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                {(['LISTA', 'GANTT'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="px-3 py-1 text-xs font-bold rounded-md transition-colors"
                    style={viewMode === mode
                      ? { background: 'var(--accent)', color: '#fff' }
                      : { color: 'var(--text-muted)' }
                    }
                  >
                    {mode === 'LISTA' ? 'Lista' : 'Cronograma'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Department Tabs */}
          {departments.length > 0 && (
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
              {departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setActiveDeptId(dept.id)}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap border shrink-0"
                  style={
                    activeDeptId === dept.id
                      ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                      : { background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                  }
                >
                  {dept.name}
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px]"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    {dept.progress}%
                  </span>
                </button>
              ))}
            </div>
          )}

          {viewMode === 'LISTA' ? (
            <>
              {/* Add Task Row */}
              {role !== 'TECNICO' && (
                <div
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 mb-6 p-4 rounded-xl border"
                  style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent)' }}
                >
                  <div>
                    <label className="block text-[10px] font-bold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Nombre de la tarea</label>
                    <input
                      type="text"
                      placeholder="ej. Instalación eléctrica panel A"
                      value={newTaskName}
                      onChange={e => setNewTaskName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                      style={inputFieldStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 uppercase flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Link2 className="w-3 h-3" /> Predecesora
                    </label>
                    <select
                      value={newTaskPredecessor}
                      onChange={e => setNewTaskPredecessor(e.target.value)}
                      style={inputFieldStyle}
                    >
                      <option value="">(Ninguna)</option>
                      {allProjectTasks.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 uppercase flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Calendar className="w-3 h-3" /> Inicio
                    </label>
                    <input type="date" value={newTaskStart} onChange={e => setNewTaskStart(e.target.value)} style={inputFieldStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 uppercase flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Calendar className="w-3 h-3" /> Fin estimado
                    </label>
                    <input type="date" value={newTaskEnd} onChange={e => setNewTaskEnd(e.target.value)} style={inputFieldStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddTask}
                      disabled={!newTaskName.trim() || addingTask}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'var(--accent)' }}
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                </div>
              )}

              {/* Task List */}
              {tasks.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Sin tareas aún.</p>
                  <p className="text-sm mt-1 opacity-70">Agrega la primera tarea del plan de trabajo.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      projectId={project.id}
                      departmentId={activeDeptId}
                      role={role}
                      products={products}
                      allProjectTasks={allProjectTasks}
                      onOptimisticUpdate={handleOptimisticUpdate}
                      onOptimisticDelete={handleOptimisticDelete}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* ── GANTT VIEW ── */
            <div className="relative overflow-x-auto pb-4">
              {tasks.filter(t => t.startDate && t.endDate).length === 0 ? (
                <div className="text-center p-12 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No hay tareas con fechas asignadas.</p>
                  <p className="text-xs mt-1 opacity-70">Regresa a la vista de Lista para establecer fechas.</p>
                </div>
              ) : (
                <div className="relative min-w-[600px] mt-4 space-y-3">
                  {(() => {
                    const tasksWithDates = tasks.filter(t => t.startDate && t.endDate);
                    const minDate = new Date(Math.min(...tasksWithDates.map(t => new Date(t.startDate!).getTime())));
                    const maxDate = new Date(Math.max(...tasksWithDates.map(t => new Date(t.endDate!).getTime())));
                    const totalDuration = Math.max(1, maxDate.getTime() - minDate.getTime());
                    const now = new Date();

                    const taskPositions = tasksWithDates.map((t, idx) => {
                      const start = new Date(t.startDate!);
                      const end = new Date(t.endDate!);
                      const leftOffset = ((start.getTime() - minDate.getTime()) / totalDuration) * 100;
                      const width = ((end.getTime() - start.getTime()) / totalDuration) * 100;
                      const predecessor = t.dependsOnTask || allProjectTasks.find(pt => pt.id === t.dependsOnTaskId);
                      const isOverdue = end < now && t.progress < 100;
                      const isBlocked = predecessor ? predecessor.progress < 100 : false;
                      return { task: t, idx, leftOffset, width, predecessor, isOverdue, isBlocked };
                    });

                    return (
                      <>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                          {taskPositions.map(tp => {
                            if (!tp.task.dependsOnTaskId) return null;
                            const predPos = taskPositions.find(p => p.task.id === tp.task.dependsOnTaskId);
                            if (!predPos) return null;

                            const x1 = Math.min(98, Math.max(1, predPos.leftOffset + predPos.width));
                            const y1 = predPos.idx * 60 + 24;
                            const x2 = Math.min(98, Math.max(1, tp.leftOffset));
                            const y2 = tp.idx * 60 + 24;

                            return (
                              <path
                                key={`svg-conn-${tp.task.id}`}
                                d={`M ${x1}% ${y1} C ${(x1 + x2) / 2}% ${y1}, ${(x1 + x2) / 2}% ${y2}, ${x2}% ${y2}`}
                                stroke={tp.isBlocked ? 'var(--warning)' : 'var(--accent)'}
                                strokeWidth="2"
                                strokeDasharray={tp.isBlocked ? '4 3' : undefined}
                                fill="none"
                              />
                            );
                          })}
                        </svg>

                        {taskPositions.map(({ task, leftOffset, width, predecessor, isOverdue, isBlocked }) => {
                          const start = new Date(task.startDate!);
                          const end = new Date(task.endDate!);
                          const isDone = task.status === 'COMPLETADA';
                          const isInProgress = task.status === 'EN_PROGRESO';

                          const borderStyle = isOverdue
                            ? 'border-red-500 border-l-4'
                            : isBlocked
                              ? 'border-amber-500 border-l-4'
                              : isDone
                                ? 'border-emerald-500 border-l-4'
                                : isInProgress
                                  ? 'border-amber-500 border-l-4'
                                  : 'border-[var(--accent)] border-l-4';

                          return (
                            <div
                              key={task.id}
                              className={`relative h-12 rounded-xl overflow-hidden flex items-center group border ${borderStyle}`}
                              style={{ background: isOverdue ? 'var(--danger-bg)' : 'var(--bg-surface-alt)', borderColor: isOverdue ? 'var(--danger)' : 'var(--border)' }}
                            >
                              <div
                                className={`absolute h-full transition-all duration-500 ${
                                  isDone ? 'bg-emerald-500/20' : isInProgress ? 'bg-amber-500/20' : ''
                                }`}
                                style={{
                                  left: `${Math.max(0, leftOffset)}%`,
                                  width: `${Math.max(2, width)}%`,
                                  background: isDone ? undefined : isInProgress ? undefined : 'var(--accent-subtle)'
                                }}
                              >
                                <div
                                  className={`h-full opacity-30 ${isDone ? 'bg-emerald-500' : isInProgress ? 'bg-amber-500' : ''}`}
                                  style={!isDone && !isInProgress ? { width: `${task.progress}%`, background: isOverdue ? 'var(--danger)' : 'var(--accent)' } : { width: `${task.progress}%` }}
                                />
                              </div>
                              <div className="relative z-10 px-4 flex justify-between w-full pointer-events-none">
                                <div className="flex items-center gap-2 truncate max-w-[55%]">
                                  {isBlocked && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                  {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                                  <span className="text-xs font-bold truncate" style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                                    {task.name}
                                  </span>
                                  {predecessor && (
                                    <span className="text-[9px] font-normal opacity-70 truncate">
                                      (predecesora: {predecessor.name})
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                                  {formatDateOnly(start)} - {formatDateOnly(end)} ({task.progress}%)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest pt-2 px-2 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                          <span>Inicio ({formatDateOnly(minDate)})</span>
                          <span>Fin Estimado ({formatDateOnly(maxDate)})</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: FINANCIERO Y COBROS ── */}
      {activeTab === 'FINANCIERO' && (
        <div className="space-y-6">
          {/* Control Financiero */}
          <div className="rounded-2xl border p-6 md:p-8" style={sectionStyle}>
            <h3 className="text-xl font-bold flex items-center gap-3 mb-6" style={{ color: 'var(--text-primary)' }}>
              <Receipt className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              Control Financiero y Presupuesto
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Presupuesto Asignado</span>
                  {role !== 'TECNICO' && (
                    <button onClick={() => setIsEditingBudget(!isEditingBudget)} className="text-[10px] font-bold transition-colors" style={{ color: 'var(--accent)' }}>
                      {isEditingBudget ? 'Cerrar' : 'Editar'}
                    </button>
                  )}
                </div>
                {isEditingBudget ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      value={budget}
                      onChange={e => setBudget(Number(e.target.value))}
                      style={inputFieldStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                    <button
                      onClick={handleSaveBudget}
                      className="px-3 py-2 rounded-lg text-sm font-bold text-white"
                      style={{ background: 'var(--accent)' }}
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>${budget.toLocaleString()}</div>
                )}
              </div>

              <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Costo Materiales (Real)</span>
                <div className="text-2xl font-black" style={{ color: 'var(--text-secondary)' }}>${materialCost.toLocaleString()}</div>
              </div>

              <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Costo Máquinas</span>
                <div className="text-2xl font-black" style={{ color: 'var(--text-secondary)' }}>${machineCost.toLocaleString()}</div>
              </div>

              {canSeeMoney && (
                <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Costo Mano de Obra ({totalHours.toLocaleString()} h)
                  </span>
                  <div className="text-2xl font-black" style={{ color: 'var(--text-secondary)' }}>${laborCost.toLocaleString()}</div>
                </div>
              )}

              <div
                className="p-4 rounded-xl border"
                style={isOverBudget
                  ? { background: 'var(--danger-bg)', borderColor: 'var(--danger)' }
                  : { background: 'var(--success-bg)', borderColor: 'var(--success)' }
                }
              >
                <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: isOverBudget ? 'var(--danger)' : 'var(--success)' }}>
                  {isOverBudget ? 'Déficit (Sobregiro)' : 'Presupuesto Restante'}
                </span>
                <div className="text-2xl font-black" style={{ color: isOverBudget ? 'var(--danger)' : 'var(--success)' }}>
                  ${Math.abs(remainingBudget).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Facturación y Cobros */}
          {canSeeMoney && (
            <div className="rounded-2xl border p-6 md:p-8" style={sectionStyle}>
              <h2 className="text-xl font-bold flex items-center gap-3 mb-6" style={{ color: 'var(--text-primary)' }}>
                <Receipt className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                Facturación y Estado de Cobros
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Monto Contratado</span>
                    <button onClick={() => setIsEditingContract(!isEditingContract)} className="text-[10px] font-bold transition-colors" style={{ color: 'var(--accent)' }}>
                      {isEditingContract ? 'Cerrar' : 'Editar'}
                    </button>
                  </div>
                  {isEditingContract ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number"
                        value={contractAmount}
                        onChange={e => setContractAmount(Number(e.target.value))}
                        style={inputFieldStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                      />
                      <button
                        onClick={handleSaveContract}
                        disabled={savingContract}
                        className="px-3 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                        style={{ background: 'var(--accent)' }}
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>${contractAmount.toLocaleString()}</div>
                  )}
                </div>

                <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Cobrado</span>
                  <div className="text-2xl font-black" style={{ color: 'var(--success)' }}>${totalPaid.toLocaleString()}</div>
                </div>

                <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Por Cobrar</span>
                  <div className="text-2xl font-black" style={{ color: 'var(--warning)' }}>${totalPendingCollection.toLocaleString()}</div>
                </div>

                <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Sin Facturar</span>
                  <div className="text-2xl font-black" style={{ color: 'var(--text-secondary)' }}>${Math.max(0, uncontractedBalance).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: HORAS Y EQUIPOS ── */}
      {activeTab === 'HORAS_EQUIPOS' && (
        <div className="space-y-6">
          {/* Registro de Horas */}
          <div className="rounded-2xl border p-6 md:p-8" style={sectionStyle}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <Clock className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                Registro de Horas Laboradas
              </h2>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {totalHours.toLocaleString()} {totalHours === 1 ? 'hora registrada' : 'horas registradas'}
              </span>
            </div>

            {/* Add Work Log Row */}
            <div
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-3 mb-6 p-4 rounded-xl border"
              style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent)' }}
            >
              <div>
                <label className="block text-[10px] font-bold mb-1 uppercase flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="w-3 h-3" /> Fecha
                </label>
                <input type="date" value={newLogDate} onChange={e => setNewLogDate(e.target.value)} style={inputFieldStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Horas</label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  placeholder="ej. 8"
                  value={newLogHours}
                  onChange={e => setNewLogHours(e.target.value)}
                  style={inputFieldStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Descripción (opcional)</label>
                <input
                  type="text"
                  placeholder="ej. Cableado de tablero principal"
                  value={newLogDesc}
                  onChange={e => setNewLogDesc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddWorkLog()}
                  style={inputFieldStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddWorkLog}
                  disabled={!newLogHours || addingLog}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)' }}
                >
                  <Plus className="w-4 h-4" />
                  Registrar
                </button>
              </div>
            </div>
            {logError && (
              <p className="text-xs font-bold mb-4 px-1" style={{ color: 'var(--danger)' }}>{logError}</p>
            )}

            {/* Work Log List */}
            {workLogs.length === 0 ? (
              <div className="text-center p-12 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Sin horas registradas aún.</p>
                <p className="text-sm mt-1 opacity-70">Registra las horas trabajadas en este proyecto para conocer su costo real.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {workLogs.map(log => (
                  <div
                    key={log.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_2fr_2fr_1fr_auto] gap-3 items-center p-4 rounded-2xl border"
                    style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                  >
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                      {formatDateOnly(log.date)}
                    </span>
                    <span className="text-xs truncate" title={log.user.email} style={{ color: 'var(--text-muted)' }}>
                      {log.user.email}
                    </span>
                    <span className="text-xs line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                      {log.description || <span className="italic opacity-60">Sin descripción</span>}
                    </span>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm font-black px-2 py-0.5 rounded border" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                        {log.hours} h
                      </span>
                      {canSeeMoney && (
                        <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                          ${(log.hours * log.hourlyCostSnapshot).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {canSeeMoney ? (
                      <button
                        onClick={() => handleDeleteWorkLog(log.id)}
                        className="p-2 rounded-lg transition-colors justify-self-end"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.color = 'var(--danger)';
                          el.style.background = 'var(--danger-bg)';
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.color = 'var(--text-muted)';
                          el.style.background = '';
                        }}
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : <span />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Máquinas Asignadas */}
          <div className="rounded-2xl border p-6 md:p-8" style={sectionStyle}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <Truck className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                Máquinas y Equipos Asignados
              </h2>
              <Link
                href="/maquinas"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-colors"
                style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Gestionar en Máquinas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {(!project.machineAssignments || project.machineAssignments.length === 0) ? (
              <div className="text-center p-12 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay máquinas asignadas a este proyecto.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {project.machineAssignments.map(a => {
                  const isActive = !a.endDate;
                  const days = daysBetween(a.startDate, a.endDate || new Date());
                  const cost = days * a.dailyRateSnapshot;
                  return (
                    <div
                      key={a.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border"
                      style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{a.machine.name}</p>
                          {isActive && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              Activa
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatDateOnly(a.startDate)} — {a.endDate ? formatDateOnly(a.endDate) : 'presente'} ({days} {days === 1 ? 'día' : 'días'})
                        </p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>${cost.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: DOCUMENTOS Y NOTAS ── */}
      {activeTab === 'DOCUMENTOS' && (
        <div className="space-y-6">
          {/* DMS */}
          <div className="rounded-2xl border p-6 md:p-8" style={sectionStyle}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <FileText className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                Documentos Técnicos (DMS)
              </h2>
              <button
                onClick={() => setDocumentModalOpen(true)}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--accent)' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <UploadCloud className="w-4 h-4" />
                Subir Documento
              </button>
            </div>

            {(!project.documents || project.documents.length === 0) ? (
              <div className="text-center p-12 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay documentos técnicos subidos.</p>
                <p className="text-sm mt-1 opacity-70">Sube el primer plano o documento para empezar.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  project.documents.reduce((acc, doc) => {
                    const f = doc.folder || 'General';
                    if (!acc[f]) acc[f] = [];
                    acc[f].push(doc);
                    return acc;
                  }, {} as Record<string, ProjectDocument[]>)
                ).sort(([a], [b]) => a.localeCompare(b)).map(([folderName, docsInFolder]) => (
                  <div key={folderName} className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
                      <div className="p-1.5 rounded-md" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
                      </div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{folderName}</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md ml-2" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                        {docsInFolder.length}
                      </span>
                    </div>

                    <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {docsInFolder.map(doc => {
                        const latestVersion = doc.versions[0];
                        const isExpanded = expandedDocs.includes(doc.id);
                        return (
                          <Card key={doc.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <button
                                onClick={() => toggleDoc(doc.id)}
                                className="flex items-center gap-1 transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                                <span className="font-medium text-sm truncate text-left" style={{ color: 'var(--text-primary)' }}>{doc.name}</span>
                              </button>
                              <span className="uppercase text-[10px] font-bold shrink-0" style={{ color: 'var(--text-muted)' }}>{doc.type}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mb-3">
                              <span className="px-2 py-0.5 rounded-md font-semibold text-xs border" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                                v{latestVersion?.version}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {latestVersion ? new Date(latestVersion.createdAt).toLocaleDateString() : '-'}
                              </span>
                            </div>
                            {latestVersion?.url && (
                              <a
                                href={latestVersion.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-full gap-1.5 font-medium text-xs px-3 py-2 rounded-lg transition-colors"
                                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                              >
                                <Download className="w-3.5 h-3.5" /> Descargar Última Versión
                              </a>
                            )}
                            {isExpanded && (
                              <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                  Historial de Versiones
                                </h4>
                                {doc.versions.map(v => (
                                  <div key={v.id} className="p-3 border rounded-lg" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                      <span className="font-bold px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)' }}>v{v.version}</span>
                                      <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                        <Clock className="w-3 h-3" /> {new Date(v.createdAt).toLocaleString()}
                                      </span>
                                      <span className="text-[10px] border-l pl-2" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                                        por {v.uploadedBy}
                                      </span>
                                    </div>
                                    <p className="text-xs mb-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                      {v.notes || <span className="italic" style={{ color: 'var(--text-muted)' }}>Sin notas adicionales</span>}
                                    </p>
                                    <a
                                      href={v.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                                      style={{ color: 'var(--text-muted)' }}
                                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-subtle)'; }}
                                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = ''; }}
                                    >
                                      <Download className="w-3 h-3" /> Bajar esta versión
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas Rápidas */}
          <div className="rounded-2xl border p-6 md:p-8" style={sectionStyle}>
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Notas Rápidas</h2>
            </div>

            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                placeholder="Escribe una nota rápida..."
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || addingNote}
                className="p-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shrink-0 text-white"
                style={{ background: 'var(--accent)' }}
                title="Guardar Nota"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {notes.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No hay notas todavía.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {notes.map(note => (
                  <div key={note.id} className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                    <p className="text-sm mb-2 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{note.content}</p>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{note.author}</span>
                      <span>•</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: ACTIVIDAD Y GESTIÓN DE ESTADO ── */}
      {activeTab === 'ACTIVIDAD' && (
        <div className="space-y-6">
          {/* Gestión de Estado */}
          <div className="rounded-2xl border p-6 md:p-8" style={sectionStyle}>
            <label className="flex items-center gap-2 text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              Gestión de Estado del Proyecto
            </label>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'NORMAL',  label: 'Normal',   Icon: CheckCircle2, activeStyle: { borderColor: 'var(--success)', background: 'var(--success-bg)', color: 'var(--success)' } },
                { id: 'RIESGO',  label: 'En Riesgo',Icon: AlertTriangle, activeStyle: { borderColor: 'var(--warning)', background: 'var(--warning-bg)', color: 'var(--warning)' } },
                { id: 'ATORADO', label: 'Atorado',  Icon: XCircle,      activeStyle: { borderColor: 'var(--danger)',  background: 'var(--danger-bg)',  color: 'var(--danger)' } },
              ].map(({ id, label, Icon, activeStyle }) => (
                <button
                  key={id}
                  onClick={() => handleSelectStatus(id)}
                  disabled={role === 'TECNICO'}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  style={
                    status === id
                      ? activeStyle
                      : { borderColor: 'var(--border)', background: 'var(--bg-surface-alt)', color: 'var(--text-muted)' }
                  }
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">{label}</span>
                </button>
              ))}
            </div>

            {blockReason && (
              <div className="p-4 rounded-xl border mb-6" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Motivo / Detalle de Causa
                </label>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{blockReason}</p>
              </div>
            )}

            {saved && <p className="text-xs font-bold text-emerald-500 mb-2">¡Estado actualizado con éxito!</p>}
          </div>

          {/* Audit Trail */}
          <div className="rounded-2xl border p-6 md:p-8" style={sectionStyle}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <Activity className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                Bitácora de Eventos y Cambios (Audit Trail)
              </h2>
            </div>

            {activityFeed.length === 0 ? (
              <div className="p-12 text-center text-sm border border-dashed rounded-2xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                No hay eventos o actividad registrados en este proyecto aún.
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {activityFeed.map(item => {
                  const isRisk = item.title.includes('Atorado') || item.title.includes('Riesgo');
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border flex gap-4 transition-all"
                      style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1"
                        style={
                          isRisk
                            ? { background: 'var(--danger-bg)', color: 'var(--danger)' }
                            : { background: 'var(--accent-subtle)', color: 'var(--accent)' }
                        }
                      >
                        {isRisk ? <ShieldAlert className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                            {formatDateOnly(item.date)} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {item.category && (
                          <span className="inline-block px-2.5 py-0.5 mb-2 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-500 border-amber-500/20">
                            Causa: {item.category}
                          </span>
                        )}
                        {item.details && (
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {item.details}
                          </p>
                        )}
                        <div className="mt-2 text-[10px] flex items-center gap-1 font-medium" style={{ color: 'var(--text-muted)' }}>
                          <Users className="w-3 h-3" /> Registrado por {item.user}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <UploadDocumentModal
        isOpen={isDocumentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        projectId={project.id}
      />

      {/* ── Status Change Modal (Phase 7) ── */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-5 animate-scale-up" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Registrar Causa de {pendingStatusChange === 'ATORADO' ? 'Bloqueo (Atorado)' : 'Riesgo'}
              </h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase" style={{ color: 'var(--text-muted)' }}>
                  Categoría del Incidente
                </label>
                <select
                  value={statusCategory}
                  onChange={e => setStatusCategory(e.target.value)}
                  style={inputFieldStyle}
                >
                  <option value="Falta de suministro">Falta de suministro / Materiales atrasados</option>
                  <option value="Fallo de diseño">Fallo de diseño / Planos incompletos</option>
                  <option value="Cliente retrasó anticipo">Cliente retrasó anticipo / Pago pendiente</option>
                  <option value="Otro">Otro motivo técnico o administrativo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase" style={{ color: 'var(--text-muted)' }}>
                  Explicación o Causa Detallada
                </label>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="Describe la causa del riesgo o bloqueo..."
                  style={inputFieldStyle}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStatusModal}
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-opacity disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {saving ? 'Guardando...' : 'Guardar e Informar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
