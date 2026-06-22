'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowRightLeft, PackageSearch } from 'lucide-react';
import ProductModal from './ProductModal';
import MovementModal from './MovementModal';

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
  projects
}: {
  products: Product[];
  categories: string[];
  currentCategory: string;
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [isMovementModalOpen, setMovementModalOpen] = useState(false);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'Todas') {
      router.push('/almacen');
    } else {
      router.push(`/almacen?category=${encodeURIComponent(val)}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="category" className="text-sm font-semibold text-slate-700">Categoría:</label>
          <select
            id="category"
            value={currentCategory}
            onChange={handleCategoryChange}
            className="border-slate-200 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-48"
          >
            <option value="Todas">Todas</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setMovementModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Movimiento
          </button>
          <button
            onClick={() => setProductModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-center">Stock Actual</th>
                <th className="px-6 py-4 text-center">Stock Mínimo</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <PackageSearch className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    No hay productos registrados en esta categoría.
                  </td>
                </tr>
              ) : (
                products.map(p => {
                  const isLowStock = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-500">{p.sku}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-medium">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-base font-bold ${isLowStock ? 'text-red-600' : 'text-emerald-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500">{p.minStock}</td>
                      <td className="px-6 py-4 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            Bajo Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Óptimo
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} />
      <MovementModal isOpen={isMovementModalOpen} onClose={() => setMovementModalOpen(false)} products={products} projects={projects} />
    </div>
  );
}
