'use client';

import { useState } from 'react';
import { createProduct } from '@/app/actions/almacen';
import { X } from 'lucide-react';

export default function ProductModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [minStock, setMinStock] = useState<number | ''>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await createProduct({ sku, name, category, minStock: Number(minStock) || 0 });
    setLoading(false);

    if (res.success) {
      setSku('');
      setName('');
      setCategory('');
      setMinStock(5);
      onClose();
    } else {
      setError(res.error || 'Error al crear producto');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Nuevo Producto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
            <input required type="text" value={sku} onChange={e => setSku(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej. MAT-ELEC-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej. Cable THW Calibre 12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <input required type="text" value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej. Eléctrico, Acero, Consumible"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo</label>
            <input required type="number" min="0" value={minStock} onChange={e => setMinStock(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm shadow-blue-200">
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
