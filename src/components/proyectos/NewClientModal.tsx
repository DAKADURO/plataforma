'use client';

import { useState } from 'react';
import { createClient } from '@/app/actions/projects';
import { X } from 'lucide-react';

export default function NewClientModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await createClient({ name, contact });
    setLoading(false);

    if (res.success) {
      setName('');
      setContact('');
      onClose();
    } else {
      setError(res.error || 'Error al registrar cliente');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Nuevo Cliente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Empresa / Cliente</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej. Industrias Metalúrgicas S.A."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contacto Principal (Opcional)</label>
            <input type="text" value={contact} onChange={e => setContact(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej. Ing. Roberto Torres - 555-0192"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg disabled:opacity-50 transition-colors shadow-sm">
              {loading ? 'Guardando...' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
