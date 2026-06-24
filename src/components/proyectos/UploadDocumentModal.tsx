'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { addDocumentVersion } from '@/app/actions/documents';
import { X, UploadCloud } from 'lucide-react';

export default function UploadDocumentModal({ 
  isOpen, 
  onClose,
  projectId
}: { 
  isOpen: boolean; 
  onClose: () => void;
  projectId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('General');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) {
      setError('Por favor selecciona un archivo y asigna un nombre.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload to Supabase Storage
      // Use a sanitized filename to avoid "Invalid key" errors from special
      // characters, spaces or non-ASCII glyphs (e.g. Chinese) in the original name.
      const fileExt = file.name.split('.').pop();
      const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${projectId}/${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      // 3. Save to Prisma
      // [SEC-FIX #3] uploadedBy ya NO se envía desde el cliente.
      // La identidad del autor se resuelve en el servidor desde la sesión JWT.
      const res = await addDocumentVersion({
        projectId,
        name,
        type: fileExt || 'unknown',
        url: publicUrl,
        folder,
        notes,
      });

      if (!res.success) throw new Error(res.error);

      // Reset & Close
      setFile(null);
      setName('');
      setFolder('General');
      setNotes('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el documento');
    } finally {
      setLoading(false);
    }
  };

  const predefinedFolders = [
    "General",
    "Planos y Diagramas",
    "Catálogos Técnicos",
    "Permisos",
    "Formatos y Contratos"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#151515] border border-transparent dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Subir Documento Técnico</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Documento</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej. Plano Eléctrico Principal"
            />
            <p className="text-xs text-slate-500 mt-1">Si el nombre ya existe en este proyecto, se creará una nueva versión automáticamente.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Carpeta de Destino</label>
            <input 
              required 
              type="text" 
              list="folder-options"
              value={folder} 
              onChange={e => setFolder(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Escribe o selecciona una carpeta..."
            />
            <datalist id="folder-options">
              {predefinedFolders.map(f => <option key={f} value={f} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Archivo (MBM, PDF, IMG)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-white/10 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-[#1a1a1a] hover:bg-slate-100 dark:hover:bg-[#202020] transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="mb-1 text-sm text-slate-500">
                    <span className="font-semibold dark:text-slate-300">Click para seleccionar</span> o arrastra el archivo
                  </p>
                  {file && <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{file.name}</p>}
                </div>
                <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas de la Versión (Opcional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px]"
              placeholder="Ej. Se ajustó la tubería en el sector norte..."
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm shadow-blue-200 dark:shadow-none">
              {loading ? 'Subiendo...' : 'Subir Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
