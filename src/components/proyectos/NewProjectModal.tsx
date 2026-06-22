'use client';

import { useState } from 'react';
import { createProject } from '@/app/actions/projects';
import { X } from 'lucide-react';

type ClientOption = {
  id: string;
  name: string;
};

export default function NewProjectModal({ isOpen, onClose, clients }: { isOpen: boolean; onClose: () => void; clients: ClientOption[] }) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!clientId) {
      setError('Por favor selecciona un cliente');
      setLoading(false);
      return;
    }

    const res = await createProject({ name, clientId });
    setLoading(false);

    if (res.success) {
      setName('');
      setClientId('');
      onClose();
    } else {
      setError(res.error || 'Error al crear proyecto');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#151515] border border-transparent dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Nuevo Proyecto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Proyecto</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej. Instalación de Estructura Norte"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cliente Asociado</label>
            <select required value={clientId} onChange={e => setClientId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="" disabled>Seleccione un cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm shadow-blue-200 dark:shadow-none">
              {loading ? 'Guardando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
