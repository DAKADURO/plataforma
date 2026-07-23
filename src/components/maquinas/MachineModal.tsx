'use client';

import { useState } from 'react';
import { createMachine } from '@/app/actions/machines';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function MachineModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [category, setCategory] = useState('Maquinaria Pesada');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await createMachine({ name, serialNumber, category, brand, model, imageUrl });
    setLoading(false);

    if (res.success) {
      setName('');
      setSerialNumber('');
      setBrand('');
      setModel('');
      setImageUrl('');
      onClose();
    } else {
      setError(res.error || 'Error al registrar máquina');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#151515] border border-transparent dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Nuevo Recurso / Equipo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Equipo</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej. Generador Eléctrico 50kW"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número de Serie</label>
              <input required type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Vehículo">Vehículo</option>
                <option value="Computación / IT">Computación / IT</option>
                <option value="Maquinaria Pesada">Maquinaria Pesada</option>
                <option value="Herramienta Especial">Herramienta Especial</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Marca</label>
              <input type="text" value={brand} onChange={e => setBrand(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Modelo</label>
              <input type="text" value={model} onChange={e => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL de Imagen (Opcional)</label>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
              Cancelar
            </button>
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? 'Guardando...' : 'Registrar Equipo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
