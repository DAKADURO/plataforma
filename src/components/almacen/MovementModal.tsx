'use client';

import { useState, useEffect } from 'react';
import { createMovement } from '@/app/actions/almacen';
import { X } from 'lucide-react';

type ProjectOption = {
  id: string;
  name: string;
};

export default function MovementModal({ 
  isOpen, 
  onClose,
  products,
  projects,
  initialProductId = '',
  initialType = 'ENTRADA'
}: { 
  isOpen: boolean; 
  onClose: () => void;
  products: { id: string, name: string, sku: string, stock: number }[];
  projects: ProjectOption[];
  initialProductId?: string;
  initialType?: 'ENTRADA' | 'SALIDA';
}) {
  const [productId, setProductId] = useState(initialProductId);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [type, setType] = useState<'ENTRADA' | 'SALIDA'>(initialType);
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update state when props change
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setProductId(initialProductId);
        setType(initialType);
        setQuantity(1);
        setProjectId('');
        setError('');
      }, 0);
    }
  }, [isOpen, initialProductId, initialType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!productId) {
      setError('Por favor selecciona un producto');
      setLoading(false);
      return;
    }

    if (type === 'SALIDA') {
      const selected = products.find(p => p.id === productId);
      if (selected && selected.stock < Number(quantity)) {
        setError(`Stock insuficiente. Stock actual: ${selected.stock}`);
        setLoading(false);
        return;
      }
    }

    const res = await createMovement({ productId, quantity: Number(quantity) || 1, type, projectId: type === 'SALIDA' ? projectId : undefined });
    setLoading(false);

    if (res.success) {
      setProductId('');
      setQuantity(1);
      setType('ENTRADA');
      setProjectId('');
      onClose();
    } else {
      setError(res.error || 'Error al registrar movimiento');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#151515] border border-transparent dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Registrar Movimiento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Movimiento</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="ENTRADA" checked={type === 'ENTRADA'} onChange={() => setType('ENTRADA')} className="text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">Entrada (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="SALIDA" checked={type === 'SALIDA'} onChange={() => setType('SALIDA')} className="text-rose-600 focus:ring-rose-500 bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10" />
                <span className="text-sm font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md">Salida (-1)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Producto</label>
            <select required value={productId} onChange={e => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="" disabled>Seleccione un producto</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name} (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>
          
          {type === 'SALIDA' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proyecto (Opcional)</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Ninguno / Uso interno</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cantidad</label>
            <input required type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm dark:shadow-none ${
                type === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
              }`}>
              {loading ? 'Guardando...' : 'Confirmar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
