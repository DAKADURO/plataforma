'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, Wrench, FileText, ArrowLeft, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import MachineModal from './MachineModal';
import MaintenanceModal from './MaintenanceModal';
import MaterialModal from './MaterialModal';

type Machine = any; // We can type this properly later
type Product = any;

export default function MachinesClient({
  machines,
  products,
  role
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
        <div className="flex justify-between items-center bg-[#151515] p-4 rounded-xl border border-white/10">
          <h2 className="text-xl font-bold text-white">Equipos Registrados</h2>
          {role !== 'TECNICO' && (
            <Button onClick={() => setMachineModalOpen(true)} variant="primary">
              <Plus className="w-4 h-4 mr-1" />
              Nueva Máquina
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              <Settings className="w-10 h-10 mx-auto mb-3 opacity-50" />
              No hay máquinas registradas.
            </div>
          ) : (
            machines.map((m: any) => (
              <div key={m.id} onClick={() => setSelectedMachine(m)} className="bg-[#151515] border border-white/10 hover:border-blue-500/50 rounded-xl p-6 cursor-pointer transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Settings className="w-6 h-6" />
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                    m.status === 'ACTIVA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    m.status === 'MANTENIMIENTO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{m.name}</h3>
                <p className="text-sm text-slate-400">S/N: {m.serialNumber}</p>
              </div>
            ))
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
          className="flex items-center gap-2 px-4 py-2 bg-[#151515] hover:bg-[#1a1a1a] border border-white/10 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Lista
        </button>
        <h2 className="text-2xl font-bold text-white">{selectedMachine.name}</h2>
      </div>

      <div className="flex border-b border-white/10">
        <button onClick={() => setActiveTab('info')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>Información</button>
        <button onClick={() => setActiveTab('materials')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'materials' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>Lista de Materiales</button>
        <button onClick={() => setActiveTab('maintenance')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'maintenance' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>Mantenimiento</button>
        <button onClick={() => setActiveTab('docs')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'docs' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>Documentos</button>
      </div>

      <div className="bg-[#151515] border border-white/10 rounded-xl p-6 min-h-[400px]">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Detalles Técnicos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-slate-500">Marca</p><p className="text-white font-medium">{selectedMachine.brand || 'N/A'}</p></div>
              <div><p className="text-sm text-slate-500">Modelo</p><p className="text-white font-medium">{selectedMachine.model || 'N/A'}</p></div>
              <div><p className="text-sm text-slate-500">Número de Serie</p><p className="text-white font-medium">{selectedMachine.serialNumber}</p></div>
              <div><p className="text-sm text-slate-500">Estado Actual</p><p className="text-white font-medium">{selectedMachine.status}</p></div>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Consumibles y Herramientas (BOM)</h3>
              {role !== 'TECNICO' && (
                <Button onClick={() => setMaterialModalOpen(true)} variant="outline" className="text-sm py-1.5">Añadir Material</Button>
              )}
            </div>
            {selectedMachine.materials?.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay materiales vinculados a esta máquina.</p>
            ) : (
              <ul className="space-y-2">
                {selectedMachine.materials.map((mat: any) => (
                  <li key={mat.id} className="flex justify-between items-center bg-[#1a1a1a] p-3 rounded-lg border border-white/5">
                    <div>
                      <p className="text-white font-medium">{mat.product.name}</p>
                      <p className="text-xs text-slate-500">SKU: {mat.product.sku}</p>
                    </div>
                    <span className="text-sm text-slate-400">Cantidad Sugerida: {mat.quantity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Historial de Mantenimiento</h3>
              <Button onClick={() => setMaintenanceModalOpen(true)} variant="primary" className="text-sm py-1.5">Registrar Mantenimiento</Button>
            </div>
            {selectedMachine.maintenances?.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay registros de mantenimiento.</p>
            ) : (
              <div className="space-y-3">
                {selectedMachine.maintenances.map((log: any) => (
                  <div key={log.id} className="bg-[#1a1a1a] p-4 rounded-lg border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                        log.type === 'PREVENTIVO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-xs text-slate-500">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-white mb-2">{log.description}</p>
                    <p className="text-xs text-slate-500">Realizado por: {log.performedBy}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Documentos y Manuales</h3>
            <p className="text-slate-500 text-sm">Funcionalidad de subida de PDFs en desarrollo.</p>
          </div>
        )}
      </div>
      
      <MaintenanceModal isOpen={isMaintenanceModalOpen} onClose={() => { setMaintenanceModalOpen(false); router.refresh(); }} machineId={selectedMachine.id} />
      <MaterialModal isOpen={isMaterialModalOpen} onClose={() => { setMaterialModalOpen(false); router.refresh(); }} machineId={selectedMachine.id} products={products} />
    </div>
  );
}
