'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowRightLeft, PackageSearch } from 'lucide-react';
import ProductModal from './ProductModal';
import MovementModal from './MovementModal';
import Card from '@/components/ui/Card';
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
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#151515] p-4 rounded-xl shadow-sm border border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="category" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Categoría:</label>
          <select
            id="category"
            value={currentCategory}
            onChange={handleCategoryChange}
            className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none w-full sm:w-48"
          >
            <option value="Todas">Todas</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Button onClick={() => setMovementModalOpen(true)} variant="secondary">
            <ArrowRightLeft className="w-4 h-4 mr-1" />
            Movimiento
          </Button>
          {role !== 'TECNICO' && (
            <Button onClick={() => setProductModalOpen(true)} variant="primary">
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Producto
            </Button>
          )}
        </div>
      </div>

        {/* Products grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              <PackageSearch className="w-12 h-12 mx-auto mb-3" />
              No hay productos registrados en esta categoría.
            </div>
          ) : (
            products.map(p => {
              const isLowStock = p.stock <= p.minStock;
              return (
                <Card key={p.id} className="border border-white/20 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-sm text-slate-500 dark:text-slate-400">{p.sku}</span>
                    <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-emerald-600'}`}>
                      {isLowStock ? 'Bajo' : 'Óptimo'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{p.name}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{p.category}</p>
                  <div className="mt-3 flex items-center justify-between text-slate-800 dark:text-slate-300">
                    <div className="text-sm">
                      <span className="font-medium">Stock:</span> {p.stock}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Mínimo:</span> {p.minStock}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Modals */}
        <ProductModal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} />
        <MovementModal isOpen={isMovementModalOpen} onClose={() => setMovementModalOpen(false)} products={products} projects={projects} />
    </div>
  );
}
