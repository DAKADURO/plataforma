'use client';

import React, { useState } from 'react';
import { updateProjectStatus } from '@/app/actions/projects';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Users, Package, FileText, UploadCloud, ChevronDown, ChevronRight, Download, Clock } from 'lucide-react';
import Link from 'next/link';
import UploadDocumentModal from './UploadDocumentModal';

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
  client: { name: string };
  inventory: InventoryItem[];
  documents: ProjectDocument[];
};

export default function ProjectDetailClient({ project }: { project: Project }) {
  const [progress, setProgress] = useState(project.progress);
  const [status, setStatus] = useState(project.status);
  const [blockReason, setBlockReason] = useState(project.blockReason || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<string[]>([]);

  const toggleDoc = (id: string) => {
    setExpandedDocs(prev => prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    await updateProjectStatus({ id: project.id, progress, status, blockReason });
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.name}</h1>
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="w-5 h-5" />
            <span className="font-medium text-lg">{project.client.name}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className="flex justify-between text-sm font-semibold text-slate-700 mb-3">
                <span>Progreso del Proyecto</span>
                <span className="text-blue-600">{progress}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="100" 
                value={progress} 
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Estado Operativo</label>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setStatus('NORMAL')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${status === 'NORMAL' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-emerald-200 text-slate-500'}`}
                >
                  <CheckCircle2 className={`w-6 h-6 mb-1 ${status === 'NORMAL' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">Normal</span>
                </button>
                <button 
                  onClick={() => setStatus('RIESGO')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${status === 'RIESGO' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 hover:border-amber-200 text-slate-500'}`}
                >
                  <AlertTriangle className={`w-6 h-6 mb-1 ${status === 'RIESGO' ? 'text-amber-600' : 'text-slate.400'}`} />
                  <span className="text-xs font-bold">En Riesgo</span>
                </button>
                <button 
                  onClick={() => setStatus('ATORADO')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${status === 'ATORADO' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 hover:border-rose-200 text-slate-500'}`}
                >
                  <XCircle className={`w-6 h-6 mb-1 ${status === 'ATORADO' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">Atorado</span>
                </button>
              </div>
            </div>

            {status === 'ATORADO' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-sm font-semibold text-rose-700 mb-2">Razón del Bloqueo</label>
                <textarea 
                  value={blockReason} 
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ej. Falta de material, permisos retrasados..."
                  className="w-full px-4 py-3 border border-rose-200 bg-rose-50/50 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-700 min-h-[100px]"
                ></textarea>
              </div>
            )}

            <div className="pt-4 flex items-center gap-4">
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-md disabled:opacity-70"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              {saved && <span className="text-emerald-600 font-medium text-sm animate-pulse">¡Actualizado!</span>}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 h-full">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-500" />
              Consumo de Almacén
            </h3>
            {project.inventory.length === 0 ? (
              <p className="text-sm text-slate-500">No se han registrado materiales para este proyecto.</p>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
                {project.inventory.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div>
                      <p className="font-medium text-sm text-slate-800">{inv.product.name}</p>
                      <p className="text-xs text-slate-500">{new Date(inv.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-sm">
                      {inv.quantity} und.
                    </span>
                  </div>
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
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Documentos Técnicos (DMS)
              </h3>
              <p className="text-sm text-slate-500 mt-1">Planos, MBM y permisos del proyecto con control de versiones.</p>
            </div>
            <button 
              onClick={() => setDocumentModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              Subir Documento
            </button>
          </div>

          {(!project.documents || project.documents.length === 0) ? (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No hay documentos técnicos subidos.</p>
              <p className="text-sm text-slate-400 mt-1">Sube el primer plano o documento para empezar.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Nombre del Documento</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Versión Actual</th>
                    <th className="px-6 py-4">Última Modificación</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {project.documents.map((doc) => {
                    const latestVersion = doc.versions[0];
                    const isExpanded = expandedDocs.includes(doc.id);
                    
                    return (
                      <React.Fragment key={doc.id}>
                        <tr className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                            <button onClick={() => toggleDoc(doc.id)} className="text-slate-400 hover:text-blue-600 transition-colors p-1">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            {doc.name}
                          </td>
                          <td className="px-6 py-4 uppercase text-xs font-bold text-slate-500">{doc.type}</td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-semibold text-xs border border-blue-100">
                              v{latestVersion?.version}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {latestVersion ? new Date(latestVersion.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {latestVersion?.url && (
                              <a href={latestVersion.url} target="_blank" rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                <Download className="w-3.5 h-3.5" /> Descargar
                              </a>
                            )}
                          </td>
                        </tr>
                        
                        {/* VERSION HISTORY DROPDOWN */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="bg-slate-50 p-0 border-b border-slate-200">
                              <div className="px-14 py-4 space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Historial de Versiones</h4>
                                {doc.versions.map((v) => (
                                  <div key={v.id} className="flex items-start justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                          v{v.version}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> {new Date(v.createdAt).toLocaleString()}
                                        </span>
                                        <span className="text-xs text-slate-400 border-l pl-2 ml-1">por {v.uploadedBy}</span>
                                      </div>
                                      <p className="text-sm text-slate-600 mt-1">
                                        <span className="font-medium text-slate-500 text-xs uppercase mr-1">Notas:</span> 
                                        {v.notes || <span className="italic text-slate-400">Sin notas adicionales</span>}
                                      </p>
                                    </div>
                                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <UploadDocumentModal isOpen={isDocumentModalOpen} onClose={() => setDocumentModalOpen(false)} projectId={project.id} />
    </div>
  );
}
