/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Settings, Wrench, FileText, ArrowLeft, Activity, ShieldAlert, ShieldCheck,
  CheckCircle2, Car, Laptop, Box, Globe, Calendar, Trash2, Search,
  Briefcase, DollarSign, Cpu
} from 'lucide-react';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import { updateMachineDailyRate } from '@/app/actions/machines';
import { assignMachineToProject, endMachineAssignment, deleteMachineAssignment } from '@/app/actions/machineAssignments';

const MachineModal = dynamic(() => import('./MachineModal'), { ssr: false });
const MaintenanceModal = dynamic(() => import('./MaintenanceModal'), { ssr: false });
const MaterialModal = dynamic(() => import('./MaterialModal'), { ssr: false });

type Machine = any;
type Product = any;
type Project = any;

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

const CATEGORY_ICONS: Record<string, any> = {
  'Vehículo': Car,
  'Computación / IT': Laptop,
  'Herramienta Especial': Wrench,
  'Maquinaria': Cpu,
};

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  'Vehículo': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  'Computación / IT': { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  'Herramienta Especial': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'Maquinaria': { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

export default function MachinesClient({
  machines,
  products,
  projects,
  role,
}: {
  machines: Machine[];
  products: Product[];
  projects: Project[];
  role: string;
}) {
  const router = useRouter();
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const selectedMachine = selectedMachineId ? machines.find((m: any) => m.id === selectedMachineId) || null : null;
  const [activeTab, setActiveTab] = useState<'info' | 'materials' | 'maintenance' | 'assignments' | 'docs'>('info');

  const [isMachineModalOpen, setMachineModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [isMaterialModalOpen, setMaterialModalOpen] = useState(false);

  const [dailyRate, setDailyRate] = useState(0);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [savingRate, startSavingRate] = useTransition();

  const [assignProjectId, setAssignProjectId] = useState('');
  const [assignStart, setAssignStart] = useState(() => new Date().toISOString().split('T')[0]);
  const [assignEnd, setAssignEnd] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assigning, startAssigning] = useTransition();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const openMachine = (m: Machine) => {
    setSelectedMachineId(m.id);
    setDailyRate(m.dailyRate || 0);
    setIsEditingRate(false);
    setAssignProjectId('');
    setAssignStart(new Date().toISOString().split('T')[0]);
    setAssignEnd('');
    setAssignError('');
  };

  const handleSaveRate = () => {
    if (!selectedMachine) return;
    startSavingRate(async () => {
      await updateMachineDailyRate(selectedMachine.id, dailyRate);
      setIsEditingRate(false);
      router.refresh();
    });
  };

  const handleAssign = () => {
    if (!selectedMachine || !assignProjectId || !assignStart) {
      setAssignError('Selecciona un proyecto y una fecha de inicio.');
      return;
    }
    setAssignError('');
    startAssigning(async () => {
      const result = await assignMachineToProject({
        machineId: selectedMachine.id,
        projectId: assignProjectId,
        startDate: assignStart,
        endDate: assignEnd || undefined,
      });
      if (result.success) {
        setAssignProjectId('');
        setAssignEnd('');
        router.refresh();
      } else {
        setAssignError(result.error || 'No se pudo asignar.');
      }
    });
  };

  const handleEndAssignment = (assignmentId: string) => {
    startAssigning(async () => {
      await endMachineAssignment(assignmentId);
      router.refresh();
    });
  };

  const handleDeleteAssignment = (assignmentId: string, projectId: string) => {
    startAssigning(async () => {
      await deleteMachineAssignment(assignmentId, projectId);
      router.refresh();
    });
  };

  // Stats calculations
  const totalMachines = machines.length;
  const activeCount = machines.filter(m => m.status === 'ACTIVA').length;
  const maintenanceCount = machines.filter(m => m.status === 'MANTENIMIENTO').length;
  const assignedCount = machines.filter(m => (m.assignments || []).some((a: any) => !a.endDate)).length;

  const categories = ['Todas', ...Array.from(new Set(machines.map(m => m.category || 'Maquinaria')))];

  const filteredMachines = machines.filter(m => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = term === '' ||
      m.name.toLowerCase().includes(term) ||
      (m.serialNumber && m.serialNumber.toLowerCase().includes(term)) ||
      (m.brand && m.brand.toLowerCase().includes(term));
    const matchesCat = selectedCategory === 'Todas' || (m.category || 'Maquinaria') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  /* ══════════════════════════════
     GRID VIEW (MAIN RECURSOS)
     ══════════════════════════════ */
  if (!selectedMachine) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* KPI Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border flex items-center justify-between shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Recursos</p>
              <p className="text-2xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>{totalMachines}</p>
            </div>
            <div className="p-3 rounded-xl border" style={{ background: 'var(--accent-subtle)', borderColor: 'transparent' }}>
              <Box className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
          </div>

          <div className="p-4 rounded-2xl border flex items-center justify-between shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Operativos / Activos</p>
              <p className="text-2xl font-extrabold mt-1 text-emerald-500">{activeCount}</p>
            </div>
            <div className="p-3 rounded-xl border" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'transparent' }}>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div className="p-4 rounded-2xl border flex items-center justify-between shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>En Mantenimiento</p>
              <p className="text-2xl font-extrabold mt-1" style={{ color: maintenanceCount > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{maintenanceCount}</p>
            </div>
            <div className="p-3 rounded-xl border" style={{ background: maintenanceCount > 0 ? 'rgba(245,158,11,0.1)' : 'var(--bg-surface-alt)', borderColor: 'transparent' }}>
              <Wrench className="w-5 h-5" style={{ color: maintenanceCount > 0 ? '#f59e0b' : 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="p-4 rounded-2xl border flex items-center justify-between shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Asignados a Proyecto</p>
              <p className="text-2xl font-extrabold mt-1 text-purple-500">{assignedCount}</p>
            </div>
            <div className="p-3 rounded-xl border" style={{ background: 'rgba(168,85,247,0.1)', borderColor: 'transparent' }}>
              <Briefcase className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          {/* Search bar */}
          <div className="relative flex-1 w-full min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o número de serie..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all border"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Action button */}
          {role !== 'TECNICO' && (
            <button
              onClick={() => setMachineModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] shrink-0"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              <Plus className="w-4 h-4" /> Nuevo Recurso
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-xs font-bold uppercase tracking-wider shrink-0 mr-1" style={{ color: 'var(--text-muted)' }}>Categorías:</span>
          {categories.map(cat => {
            const count = cat === 'Todas' ? machines.length : machines.filter(m => (m.category || 'Maquinaria') === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0 flex items-center gap-1.5"
                style={isSelected
                  ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                  : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              >
                <span>{cat}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMachines.length === 0 ? (
            <div className="col-span-full text-center py-16 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <Box className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No se encontraron recursos.</p>
            </div>
          ) : (
            filteredMachines.map((m: any) => {
              const catKey = m.category || 'Maquinaria';
              const Icon = CATEGORY_ICONS[catKey] || Settings;
              const catTheme = CATEGORY_COLORS[catKey] || { color: 'var(--accent)', bg: 'var(--accent-subtle)' };
              
              const isValidImageUrl = m.imageUrl && (m.imageUrl.startsWith('http://') || m.imageUrl.startsWith('https://') || m.imageUrl.startsWith('/'));
              const activeAssignment = (m.assignments || []).find((a: any) => !a.endDate);

              return (
                <div
                  key={m.id}
                  onClick={() => openMachine(m)}
                  className="group rounded-2xl p-5 cursor-pointer transition-all duration-200 relative border flex flex-col justify-between"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'var(--border-focus)';
                    el.style.transform = 'translateY(-2px)';
                    el.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'var(--border)';
                    el.style.transform = '';
                    el.style.boxShadow = '';
                  }}
                >
                  <div>
                    {/* Header Image or Banner */}
                    {isValidImageUrl && (
                      <div
                        className="h-36 -mx-5 -mt-5 mb-4 border-b overflow-hidden relative"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <img
                          src={m.imageUrl}
                          alt={m.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Top Row Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-2 rounded-xl border flex items-center justify-center"
                          style={{ background: catTheme.bg, borderColor: 'transparent' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: catTheme.color }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                          {catKey}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                          m.status === 'ACTIVA'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : m.status === 'MANTENIMIENTO'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          m.status === 'ACTIVA' ? 'bg-emerald-500' : m.status === 'MANTENIMIENTO' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {m.status}
                      </span>
                    </div>

                    {/* Title & Serial */}
                    <h3 className="text-lg font-bold mb-1 group-hover:text-blue-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {m.name}
                    </h3>
                    <p className="text-xs font-mono mb-3" style={{ color: 'var(--text-muted)' }}>
                      S/N: {m.serialNumber || 'Sin serie'}
                    </p>

                    {/* Active Assignment Badge */}
                    {activeAssignment && (
                      <div className="mb-3 px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs" style={{ background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.2)', color: '#a855f7' }}>
                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate font-semibold">{activeAssignment.project?.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Stats Row */}
                  <div className="flex items-center justify-between border-t pt-3 mt-2" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-1.5">
                      {m.isImported && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                          style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', borderColor: 'rgba(245,158,11,0.3)' }}>
                          <Globe className="w-3 h-3" /> Importado
                        </span>
                      )}
                    </div>
                    {m.dailyRate > 0 && (
                      <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                        ${m.dailyRate.toLocaleString()} / día
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <MachineModal isOpen={isMachineModalOpen} onClose={() => setMachineModalOpen(false)} />
      </div>
    );
  }

  /* ══════════════════════════════
     DETAIL VIEW
     ══════════════════════════════ */
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedMachineId(null)}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all border shrink-0"
            style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            title="Volver a Lista"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                {selectedMachine.name}
              </h2>
              <span
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                  selectedMachine.status === 'ACTIVA'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : selectedMachine.status === 'MANTENIMIENTO'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}
              >
                {selectedMachine.status}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5" style={{ color: 'var(--text-muted)' }}>
              S/N: {selectedMachine.serialNumber} · {selectedMachine.category || 'Maquinaria'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex border-b overflow-x-auto scrollbar-hide" style={{ borderColor: 'var(--border)' }}>
        {(['info', 'materials', 'maintenance', 'assignments', 'docs'] as const).map(tab => {
          const labels = { info: 'Información', materials: 'Lista de Materiales', maintenance: 'Mantenimiento', assignments: 'Asignaciones a Proyectos', docs: 'Documentos' };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0"
              style={{
                borderColor: activeTab === tab ? 'var(--accent)' : 'transparent',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
              }}
              onMouseEnter={e => { if (activeTab !== tab) (e.currentTarget.style.color = 'var(--text-primary)'); }}
              onMouseLeave={e => { if (activeTab !== tab) (e.currentTarget.style.color = 'var(--text-muted)'); }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      <div
        className="rounded-2xl p-6 min-h-[400px] border shadow-sm"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {activeTab === 'info' && (
          <div className="flex flex-col md:flex-row gap-8">
            {selectedMachine.imageUrl && (selectedMachine.imageUrl.startsWith('http://') || selectedMachine.imageUrl.startsWith('https://') || selectedMachine.imageUrl.startsWith('/')) && (
              <div className="w-full md:w-1/3 lg:w-1/4">
                <img
                  src={selectedMachine.imageUrl}
                  alt={selectedMachine.name}
                  className="w-full h-auto rounded-xl border shadow-lg object-cover"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            )}
            <div className="flex-1 space-y-4">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Detalles Técnicos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Categoría',      value: selectedMachine.category || 'Maquinaria' },
                  { label: 'Estado Actual',  value: selectedMachine.status },
                  { label: 'Marca',          value: selectedMachine.brand || 'N/A' },
                  { label: 'Modelo',         value: selectedMachine.model || 'N/A' },
                  { label: 'Número de Serie',value: selectedMachine.serialNumber },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Origen</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {selectedMachine.isImported ? (
                      <>
                        <Globe className="w-3.5 h-3.5" style={{ color: '#d97706' }} />
                        <span className="font-medium" style={{ color: '#d97706' }}>Importado</span>
                      </>
                    ) : (
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Nacional</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm mb-0.5" style={{ color: 'var(--text-muted)' }}>Tarifa de uso / día</p>
                  {isEditingRate ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={dailyRate}
                        onChange={e => setDailyRate(Number(e.target.value))}
                        className="w-28 rounded-lg px-3 py-1.5 text-sm outline-none"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveRate}
                        disabled={savingRate}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                        style={{ background: 'var(--accent)' }}
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>${(selectedMachine.dailyRate || 0).toLocaleString()}</span>
                      {role !== 'TECNICO' && (
                        <button onClick={() => setIsEditingRate(true)} className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                          Editar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Consumibles y Herramientas (BOM)
              </h3>
              {role !== 'TECNICO' && (
                <Button onClick={() => setMaterialModalOpen(true)} variant="secondary" className="text-sm py-1.5">
                  Añadir Material
                </Button>
              )}
            </div>
            {selectedMachine.materials?.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No hay materiales vinculados a esta máquina.
              </p>
            ) : (
              <ul className="space-y-2">
                {selectedMachine.materials.map((mat: any) => (
                  <li
                    key={mat.id}
                    className="flex justify-between items-center p-3 rounded-lg border"
                    style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {mat.product ? (
                          <span className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded font-bold uppercase tracking-wider">
                            Almacén
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-bold uppercase tracking-wider">
                            Libre
                          </span>
                        )}
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {mat.product ? mat.product.name : mat.name}
                        </p>
                      </div>
                      {mat.product && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          SKU: {mat.product.sku}
                        </p>
                      )}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Cant: {mat.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Wrench className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  Historial de Mantenimiento y Servicios
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Registro de afinaciones, servicios preventivos y reparaciones del equipo.
                </p>
              </div>
              <Button onClick={() => setMaintenanceModalOpen(true)} variant="primary" className="text-sm py-2 px-4 flex items-center gap-2 font-bold shadow-md shrink-0">
                <Plus className="w-4 h-4" />
                Registrar Mantenimiento
              </Button>
            </div>

            {/* Quick Metrics Bar for Machine Maintenance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border flex items-center justify-between" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Servicios Registrados</span>
                  <span className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{selectedMachine.maintenances?.length || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Wrench className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border flex items-center justify-between" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Último Servicio</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {selectedMachine.maintenances && selectedMachine.maintenances.length > 0
                      ? new Date(selectedMachine.maintenances[0].date).toLocaleDateString()
                      : 'Sin registros'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border flex items-center justify-between" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Estado Técnico</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded border inline-block mt-0.5" style={{ background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success)' }}>
                    🟢 En Regla
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            </div>

            {selectedMachine.maintenances?.length === 0 ? (
              <div
                onClick={() => setMaintenanceModalOpen(true)}
                className="cursor-pointer text-center p-10 border-2 border-dashed rounded-2xl transition-all group"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-alt)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  <Wrench className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Sin Historial de Mantenimiento Registrado
                </h4>
                <p className="text-xs mb-4 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                  Lleva la bitácora técnica de este activo (cambios de aceite, servicios preventivos o afinación) para prevenir averías.
                </p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm" style={{ background: 'var(--accent)' }}>
                  <Plus className="w-4 h-4" /> Registrar Primer Mantenimiento
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedMachine.maintenances.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border space-y-2 transition-all hover:border-slate-600"
                    style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                            log.type === 'PREVENTIVO'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {log.type === 'PREVENTIVO' ? '🛠️ PREVENTIVO' : '🛑 CORRECTIVO'}
                        </span>
                        <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                          Taller/Responsable: {log.performedBy || 'Interno'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-muted)' }}>
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{log.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Asignaciones a Proyectos
            </h3>

            {role !== 'TECNICO' && (
              <div
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 mb-4 p-4 rounded-xl border"
                style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent)' }}
              >
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Proyecto</label>
                  <select
                    value={assignProjectId}
                    onChange={e => setAssignProjectId(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">Selecciona un proyecto...</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Calendar className="w-3 h-3" /> Inicio
                  </label>
                  <input
                    type="date"
                    value={assignStart}
                    onChange={e => setAssignStart(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Calendar className="w-3 h-3" /> Fin (opcional)
                  </label>
                  <input
                    type="date"
                    value={assignEnd}
                    onChange={e => setAssignEnd(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAssign}
                    disabled={!assignProjectId || assigning}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Plus className="w-4 h-4" />
                    Asignar
                  </button>
                </div>
              </div>
            )}
            {assignError && (
              <p className="text-xs font-bold mb-4 px-1" style={{ color: 'var(--danger)' }}>{assignError}</p>
            )}

            {(!selectedMachine.assignments || selectedMachine.assignments.length === 0) ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Esta máquina no ha sido asignada a ningún proyecto todavía.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedMachine.assignments.map((a: any) => {
                  const isActive = !a.endDate;
                  const days = daysBetween(a.startDate, a.endDate || new Date());
                  const cost = days * a.dailyRateSnapshot;
                  return (
                    <div
                      key={a.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-lg border"
                      style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{a.project?.name}</p>
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
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>${cost.toLocaleString()}</span>
                        {role !== 'TECNICO' && (
                          <>
                            {isActive && (
                              <button
                                onClick={() => handleEndAssignment(a.id)}
                                disabled={assigning}
                                className="text-xs font-bold px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                                style={{ color: 'var(--accent)' }}
                              >
                                Finalizar hoy
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAssignment(a.id, a.projectId)}
                              disabled={assigning}
                              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLElement).style.background = 'var(--danger-bg)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = ''; }}
                              title="Eliminar asignación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Documentos y Manuales
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Funcionalidad de subida de PDFs en desarrollo.
            </p>
          </div>
        )}
      </div>

      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => { setMaintenanceModalOpen(false); router.refresh(); }}
        machineId={selectedMachine.id}
      />
      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => { setMaterialModalOpen(false); router.refresh(); }}
        machineId={selectedMachine.id}
        products={products}
      />
    </div>
  );
}
