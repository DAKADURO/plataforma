'use client';

import { useState } from 'react';
import { addMachineMaterial } from '@/app/actions/machines';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function MaterialModal({ isOpen, onClose, machineId, products }: { isOpen: boolean; onClose: () => void; machineId: string; products: any[] }) {
  const [productId, setProductId] = useState(products.length > 0 ? products[0].id : '');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setError('Debes seleccionar un producto.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await addMachineMaterial(machineId, productId, quantity);
    setLoading(false);

    if (res.success) {
      setQuantity(1);
      onClose();
    } else {
      setError(res.error || 'Error al vincular el material');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#151515] border border-transparent dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Vincular Material (BOM)</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Producto del Almacén</label>
            <select required value={productId} onChange={e => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cantidad Sugerida</label>
            <input required type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
              Cancelar
            </button>
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? 'Guardando...' : 'Vincular'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
