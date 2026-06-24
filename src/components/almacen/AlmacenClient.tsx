'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ArrowDownToLine, ArrowUpFromLine, PackageSearch } from 'lucide-react';
import ProductModal from './ProductModal';
import MovementModal from './MovementModal';
import Button from '@/components/ui/Button';

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  minStock: number;
  stock: number;
};

type ProjectOption = {
  id: string;
  name: string;
};

export default function AlmacenClient({
  products,
  categories,
  currentCategory,
  projects,
  role
}: {
  products: Product[];
  categories: string[];
  currentCategory: string;
  projects: ProjectOption[];
  role: string;
}) {
  const router = useRouter();
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [movementState, setMovementState] = useState<{isOpen: boolean, productId?: string, type?: 'ENTRADA' | 'SALIDA'}>({isOpen: false});
  const [searchTerm, setSearchTerm] = useState('');

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'Todas') {
      router.push('/almacen');
    } else {
      router.push(`/almacen?category=${encodeURIComponent(val)}`);
    }
  };

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#151515] p-4 rounded-xl border border-white/10">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por SKU o Nombre..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="category" className="text-sm font-semibold text-slate-400">Categoría:</label>
            <select
              id="category"
              value={currentCategory}
              onChange={handleCategoryChange}
              className="bg-[#1a1a1a] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none w-full sm:w-48"
            >
              <option value="Todas">Todas</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {role !== 'TECNICO' && (
            <Button onClick={() => setProductModalOpen(true)} variant="primary" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Producto
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#151515] rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-[#1a1a1a] text-slate-500 border-b border-white/10">
              <tr>
                <th scope="col" className="px-4 py-4 font-semibold">SKU</th>
                <th scope="col" className="px-4 py-4 font-semibold">Producto</th>
                <th scope="col" className="px-4 py-4 font-semibold">Categoría</th>
                <th scope="col" className="px-4 py-4 font-semibold text-center">Stock Actual</th>
                <th scope="col" className="px-4 py-4 font-semibold text-center">Mínimo</th>
                <th scope="col" className="px-4 py-4 font-semibold">Estado</th>
                {role !== 'TECNICO' && <th scope="col" className="px-4 py-4 font-semibold text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={role !== 'TECNICO' ? 7 : 6} className="text-center py-12 text-slate-500">
                    <PackageSearch className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isLowStock = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.sku}</td>
                      <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                      <td className="px-4 py-3 text-slate-400">{p.category}</td>
                      <td className="px-4 py-3 text-center font-bold text-white">{p.stock}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{p.minStock}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          isLowStock 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isLowStock ? 'Bajo Stock' : 'Suficiente'}
                        </span>
                      </td>
                      {role !== 'TECNICO' && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setMovementState({ isOpen: true, productId: p.id, type: 'ENTRADA' })}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors border border-transparent hover:border-emerald-500/20"
                              title="Registrar Entrada"
                            >
                              <ArrowDownToLine className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setMovementState({ isOpen: true, productId: p.id, type: 'SALIDA' })}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
                              title="Registrar Salida"
                            >
                              <ArrowUpFromLine className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductModal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} />
      <MovementModal 
        isOpen={movementState.isOpen} 
        onClose={() => setMovementState({ isOpen: false })} 
        products={products} 
        projects={projects}
        initialProductId={movementState.productId}
        initialType={movementState.type}
      />
    </div>
  );
}
