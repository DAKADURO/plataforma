/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { addMachineMaterial } from '@/app/actions/machines';
import { X, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProductModal from '@/components/almacen/ProductModal';

export default function MaterialModal({ isOpen, onClose, machineId, products }: { isOpen: boolean; onClose: () => void; machineId: string; products: any[] }) {
  const [type, setType] = useState<'ALMACEN' | 'LIBRE'>('ALMACEN');
  const [productId, setProductId] = useState(products.length > 0 ? products[0].id : '');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProductModalOpen, setProductModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'ALMACEN' && !productId) {
      setError('Debes seleccionar un producto.');
      return;
    }
    if (type === 'LIBRE' && !name) {
      setError('Debes escribir el nombre del componente.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await addMachineMaterial(machineId, type === 'ALMACEN' ? productId : undefined, type === 'LIBRE' ? name : undefined, quantity);
    setLoading(false);

    if (res.success) {
      setQuantity(1);
      setName('');
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
          
          <div className="flex gap-4 border-b border-slate-200 dark:border-white/10 pb-2">
            <button type="button" onClick={() => setType('ALMACEN')} className={`text-sm font-medium pb-2 -mb-[9px] transition-colors ${type === 'ALMACEN' ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400' : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>Del Almacén</button>
            <button type="button" onClick={() => setType('LIBRE')} className={`text-sm font-medium pb-2 -mb-[9px] transition-colors ${type === 'LIBRE' ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400' : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>Componente Libre</button>
          </div>

          {type === 'ALMACEN' ? (
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Producto del Almacén</label>
                <button 
                  type="button" 
                  onClick={() => setProductModalOpen(true)}
                  className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" /> Crear Nuevo
                </button>
              </div>
              <select required={type === 'ALMACEN'} value={productId} onChange={e => setProductId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="" disabled>Selecciona un producto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Componente</label>
              <input required={type === 'LIBRE'} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Filtro de Aceite Modelo X"
                className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}
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
      <ProductModal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} />
    </div>
  );
}
