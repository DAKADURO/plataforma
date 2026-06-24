'use client';

import React, { useState } from 'react';
import { updateProjectStatus } from '@/app/actions/projects';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Users, Package, FileText, UploadCloud, ChevronDown, ChevronRight, Download, Clock, Save } from 'lucide-react';
import Link from 'next/link';
import UploadDocumentModal from './UploadDocumentModal';
import Card from '@/components/ui/Card';

// ---- Types derived from Prisma shape ----
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

type Project = {
  id: string;
  name: string;
  progress: number;
  status: string;
  blockReason: string | null;
  phase: string;
  startDate: Date | null;
  endDate: Date | null;
  client: { name: string };
  inventory: InventoryItem[];
  documents: ProjectDocument[];
};

export default function ProjectDetailClient({ project, role }: { project: Project, role: string }) {
  const [progress, setProgress] = useState(project.progress);
  const [status, setStatus] = useState(project.status);
  const [blockReason, setBlockReason] = useState(project.blockReason || '');
  const [phase, setPhase] = useState(project.phase || 'PLANIFICACION');
  const [startDate, setStartDate] = useState(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
  const [endDate, setEndDate] = useState(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<string[]>([]);

  const toggleDoc = (id: string) => {
    setExpandedDocs(prev => prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]);
  };

  const handleSaveStatus = async () => {
    setLoading(true);
    setSaved(false);
    
    // Convert date strings back to Date objects if they exist
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;
    
    await updateProjectStatus({ 
      id: project.id, 
      progress, 
      status, 
      blockReason,
      phase,
      startDate: parsedStartDate,
      endDate: parsedEndDate
    });
    
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Link href="/proyectos" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver al Tablero
      </Link>

      <div className="bg-white dark:bg-[#151515] rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-white/10 p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{project.name}</h1>
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="w-5 h-5" />
            <span className="font-medium text-lg">{project.client.name}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fase del Proyecto</label>
                <select 
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  disabled={role === 'TECNICO'}
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                >
                  <option value="PLANIFICACION">Planificación</option>
                  <option value="COMPRAS/INGENIERIA">Compras / Ingeniería</option>
                  <option value="EJECUCION">Ejecución</option>
                  <option value="CIERRE">Cierre</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Fecha de Inicio</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={role === 'TECNICO'}
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Fecha Final Estimada</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={role === 'TECNICO'}
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                <span>Progreso del Proyecto</span>
                <span className="text-blue-600">{progress}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="100" 
                value={progress} 
                disabled={role === 'TECNICO'}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Estado Operativo</label>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setStatus('NORMAL')}
                  disabled={role === 'TECNICO'}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'TECNICO' ? 'cursor-not-allowed opacity-50' : ''} ${status === 'NORMAL' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-emerald-200 text-slate-500'}`}
                >
                  <CheckCircle2 className={`w-6 h-6 mb-1 ${status === 'NORMAL' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">Normal</span>
                </button>
                <button 
                  onClick={() => setStatus('RIESGO')}
                  disabled={role === 'TECNICO'}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'TECNICO' ? 'cursor-not-allowed opacity-50' : ''} ${status === 'RIESGO' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 hover:border-amber-200 text-slate-500'}`}
                >
                  <AlertTriangle className={`w-6 h-6 mb-1 ${status === 'RIESGO' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">En Riesgo</span>
                </button>
                <button 
                  onClick={() => setStatus('ATORADO')}
                  disabled={role === 'TECNICO'}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'TECNICO' ? 'cursor-not-allowed opacity-50' : ''} ${status === 'ATORADO' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 hover:border-rose-200 text-slate-500'}`}
                >
                  <XCircle className={`w-6 h-6 mb-1 ${status === 'ATORADO' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">Atorado</span>
                </button>
              </div>
            </div>

            {status === 'ATORADO' && role !== 'TECNICO' && (
              <div className="animate-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Motivo del Bloqueo</label>
                <textarea 
                  rows={2}
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="Explica brevemente por qué el proyecto está atorado..."
                  className="block w-full rounded-xl border-slate-300 dark:border-white/10 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white"
                />
              </div>
            )}
            {status === 'ATORADO' && role === 'TECNICO' && blockReason && (
               <div className="animate-in slide-in-from-top-2 p-3 bg-rose-50 rounded-xl border border-rose-200">
                <label className="block text-sm font-bold text-rose-800 mb-1">Motivo del Bloqueo</label>
                <p className="text-sm text-rose-700">{blockReason}</p>
              </div>
            )}

            <div className="pt-4 flex items-center gap-4">
              {role !== 'TECNICO' && (
                <button
                  onClick={handleSaveStatus}
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 rounded-xl border border-transparent bg-slate-900 py-3 px-4 text-sm font-bold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Guardando...' : (
                    <>
                      <Save className="w-4 h-4" /> Guardar Cambios de Estado
                    </>
                  )}
                </button>
              )}
              {saved && <span className="text-emerald-600 font-medium text-sm animate-pulse">¡Actualizado!</span>}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-500" />
              Consumo de Almacén
            </h3>
            {project.inventory.length === 0 ? (
              <p className="text-sm text-slate-500">No se han registrado materiales para este proyecto.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {project.inventory.map(inv => (
                  <Card key={inv.id} className="p-4 border border-white/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{inv.product.name}</span>
                      <span className="text-xs text-slate-500">{new Date(inv.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{inv.quantity} und.</div>
                  </Card>
                ))}
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <Link href="/almacen" className="text-sm font-semibold text-blue-600 hover:underline">
                Vincular más materiales desde Almacén →
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION: GESTOR DOCUMENTAL (DMS) */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => setDocumentModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              Subir Documento
            </button>
          </div>

         <div className="space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Documentos Técnicos (DMS)
          </h3>
          {(!project.documents || project.documents.length === 0) ? (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No hay documentos técnicos subidos.</p>
              <p className="text-sm text-slate-400 mt-1">Sube el primer plano o documento para empezar.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {project.documents.map(doc => {
                const latestVersion = doc.versions[0];
                const isExpanded = expandedDocs.includes(doc.id);
                return (
                  <Card key={doc.id} className="p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => toggleDoc(doc.id)} className="flex items-center gap-1 text-slate-500 hover:text-blue-600">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-medium">{doc.name}</span>
                      </button>
                      <span className="uppercase text-xs font-bold text-slate-500">{doc.type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-semibold border border-blue-100">v{latestVersion?.version}</span>
                      <span className="text-slate-500">{latestVersion ? new Date(latestVersion.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                    {latestVersion?.url && (
                      <a href={latestVersion.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                        <Download className="w-3.5 h-3.5" /> Descargar
                      </a>
                    )}
                    {isExpanded && (
                      <div className="mt-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Historial de Versiones</h4>
                        {doc.versions.map(v => (
                          <Card key={v.id} className="p-3 border border-white/10 bg-white dark:bg-[#1a1a1a]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-xs">v{v.version}</span>
                              <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(v.createdAt).toLocaleString()}</span>
                              <span className="text-xs text-slate-400 border-l pl-2 ml-1">por {v.uploadedBy}</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{v.notes || <span className="italic text-slate-400 dark:text-slate-500">Sin notas adicionales</span>}</p>
                            <a href={v.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block mt-2">
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
      </div>
      </div>

      <UploadDocumentModal isOpen={isDocumentModalOpen} onClose={() => setDocumentModalOpen(false)} projectId={project.id} />
    </div>
  );
}
