/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, Wrench, FileText, ArrowLeft, Activity, ShieldAlert, CheckCircle2, Car, Laptop, Box, Globe } from 'lucide-react';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';

const MachineModal = dynamic(() => import('./MachineModal'), { ssr: false });
const MaintenanceModal = dynamic(() => import('./MaintenanceModal'), { ssr: false });
const MaterialModal = dynamic(() => import('./MaterialModal'), { ssr: false });

type Machine = any;
type Product = any;

export default function MachinesClient({
  machines,
  products,
  role,
}: {
  machines: Machine[];
  products: Product[];
  role: string;
}) {
  const router = useRouter();
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'materials' | 'maintenance' | 'docs'>('info');

  const [isMachineModalOpen, setMachineModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [isMaterialModalOpen, setMaterialModalOpen] = useState(false);

  if (!selectedMachine) {
    return (
      <div className="space-y-6">
        <div
          className="flex justify-between items-center p-4 rounded-xl border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Recursos y Equipos Registrados
          </h2>
          {role !== 'TECNICO' && (
            <Button onClick={() => setMachineModalOpen(true)} variant="primary">
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Recurso
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.length === 0 ? (
            <div className="col-span-full text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <Box className="w-10 h-10 mx-auto mb-3 opacity-30" />
              No hay recursos registrados.
            </div>
          ) : (
            machines.map((m: any) => {
              const Icon =
                m.category === 'Vehículo' ? Car
                : m.category === 'Computación / IT' ? Laptop
                : m.category === 'Herramienta Especial' ? Wrench
                : Settings;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMachine(m)}
                  className="rounded-xl p-6 cursor-pointer transition-all overflow-hidden relative border"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'var(--accent)';
                    el.style.boxShadow = '0 4px 20px -4px rgba(37,99,235,0.15)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'var(--border)';
                    el.style.boxShadow = '';
                  }}
                >
                  {m.imageUrl && (
                    <div
                      className="h-32 -mx-6 -mt-6 mb-4 border-b overflow-hidden"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <img
                        src={m.imageUrl}
                        alt={m.name}
                        className="w-full h-full object-cover opacity-80 transition-opacity"
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-lg transition-colors"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {m.category || 'Maquinaria'}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                        m.status === 'ACTIVA'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : m.status === 'MANTENIMIENTO'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{m.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>S/N: {m.serialNumber}</p>
                  {m.isImported && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', borderColor: 'rgba(245,158,11,0.3)' }}>
                      <Globe className="w-3 h-3" />
                      Importado
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <MachineModal isOpen={isMachineModalOpen} onClose={() => setMachineModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setSelectedMachine(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Lista
        </button>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {selectedMachine.name}
        </h2>
      </div>

      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {(['info', 'materials', 'maintenance', 'docs'] as const).map(tab => {
          const labels = { info: 'Información', materials: 'Lista de Materiales', maintenance: 'Mantenimiento', docs: 'Documentos' };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
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
        className="rounded-xl p-6 min-h-[400px] border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {activeTab === 'info' && (
          <div className="flex flex-col md:flex-row gap-8">
            {selectedMachine.imageUrl && (
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
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Historial de Mantenimiento
              </h3>
              <Button onClick={() => setMaintenanceModalOpen(true)} variant="primary" className="text-sm py-1.5">
                Registrar Mantenimiento
              </Button>
            </div>
            {selectedMachine.maintenances?.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No hay registros de mantenimiento.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedMachine.maintenances.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-lg border"
                    style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                          log.type === 'PREVENTIVO'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}
                      >
                        {log.type}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{log.description}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Realizado por: {log.performedBy}
                    </p>
                  </div>
                ))}
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
