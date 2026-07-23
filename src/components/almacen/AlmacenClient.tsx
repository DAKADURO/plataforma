/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ArrowDownToLine, ArrowUpFromLine, PackageSearch, ArrowLeft, FolderOpen, Trash2, Zap, Droplets, Wind, HardHat, Monitor } from 'lucide-react';
import { deleteProduct } from '@/app/actions/almacen';
import ProductModal from './ProductModal';
import MovementModal from './MovementModal';
import Button from '@/components/ui/Button';

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  department: string;
  itemType: string;
  minStock: number;
  stock: number;
};

type ProjectOption = {
  id: string;
  name: string;
};

const DEPARTMENTS_DATA = [
  { name: 'General',   icon: FolderOpen, accent: 'var(--accent)',   accentBg: 'var(--accent-subtle)' },
  { name: 'HVAC',      icon: Wind,        accent: '#06b6d4',         accentBg: 'rgba(6,182,212,0.1)' },
  { name: 'Eléctrico', icon: Zap,         accent: '#f59e0b',         accentBg: 'rgba(245,158,11,0.1)' },
  { name: 'Plomería',  icon: Droplets,    accent: '#3b82f6',         accentBg: 'rgba(59,130,246,0.1)' },
  { name: 'Civil',     icon: HardHat,     accent: '#10b981',         accentBg: 'rgba(16,185,129,0.1)' },
  { name: 'Sistemas',  icon: Monitor,     accent: '#a855f7',         accentBg: 'rgba(168,85,247,0.1)' },
];

export default function AlmacenClient({
  products,
  categories,
  currentCategory,
  currentDepartment,
  projects,
  role,
}: {
  products: Product[];
  categories: string[];
  currentCategory: string;
  currentDepartment?: string;
  projects: ProjectOption[];
  role: string;
}) {
  const router = useRouter();
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [movementState, setMovementState] = useState<{ isOpen: boolean; productId?: string; type?: 'ENTRADA' | 'SALIDA' }>({ isOpen: false });
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

  /* ── Vista de departamentos ─────────────────────────────────── */
  if (!currentDepartment) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div
          className="flex flex-col md:flex-row justify-between items-center p-6 rounded-2xl border shadow-[var(--shadow-sm)]"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Departamentos
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Selecciona un área para gestionar su inventario
            </p>
          </div>
          {role !== 'TECNICO' && (
            <button
              onClick={() => setProductModalOpen(true)}
              className="mt-4 md:mt-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:-translate-y-px active:translate-y-0"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              <Plus className="w-5 h-5" />
              Nuevo Producto
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEPARTMENTS_DATA.map(dept => {
            const Icon = dept.icon;
            return (
              <button
                key={dept.name}
                onClick={() => router.push(`/almacen?department=${encodeURIComponent(dept.name)}`)}
                className="group flex flex-col items-center justify-center p-8 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-focus)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
              >
                <div
                  className="p-4 rounded-2xl mb-5 border transition-colors"
                  style={{ background: dept.accentBg, borderColor: 'var(--border)' }}
                >
                  <Icon className="w-10 h-10" strokeWidth={1.5} style={{ color: dept.accent }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {dept.name}
                </h3>
                <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                  Ver inventario
                </p>
              </button>
            );
          })}
        </div>

        <ProductModal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} />
      </div>
    );
  }

  /* ── Vista de inventario por departamento ───────────────────── */
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/almacen')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Departamentos
        </button>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Inventario: {currentDepartment}
        </h2>
      </div>

      {/* Header controls */}
      <div
        className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por SKU o Nombre..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--border-focus)] border"
              style={{
                background: 'var(--bg-surface-alt)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="category" className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Categoría:
            </label>
            <select
              id="category"
              value={currentCategory}
              onChange={handleCategoryChange}
              className="rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--border-focus)] w-full sm:w-48 border"
              style={{
                background: 'var(--bg-surface-alt)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="Todas">Todas</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {role !== 'TECNICO' && (
          <button
            onClick={() => setProductModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-px active:translate-y-0"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Mobile card list */}
      <div className="block md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <PackageSearch className="w-10 h-10 mx-auto mb-3 opacity-40" />
            No se encontraron productos.
          </div>
        ) : (
          filteredProducts.map(p => {
            const isLowStock = p.stock <= p.minStock;
            return (
              <div key={p.id} className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.sku}</p>
                  </div>
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0"
                    style={isLowStock
                      ? { background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger-bg)' }
                      : { background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success-bg)' }}
                  >
                    {isLowStock ? 'Bajo Stock' : 'Suficiente'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{p.category}</span>
                  <span>·</span>
                  <span>{p.department}</span>
                  <span>·</span>
                  <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>{p.itemType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    <span><span className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.stock}</span> <span style={{ color: 'var(--text-muted)' }}>stock</span></span>
                    <span><span style={{ color: 'var(--text-muted)' }}>mín</span> {p.minStock}</span>
                  </div>
                  {role !== 'TECNICO' && (
                    <div className="flex gap-2">
                      <button onClick={() => setMovementState({ isOpen: true, productId: p.id, type: 'ENTRADA' })} className="p-1.5 rounded-lg" style={{ color: 'var(--success)', background: 'var(--success-bg)' }} title="Entrada"><ArrowDownToLine className="w-4 h-4" /></button>
                      <button onClick={() => setMovementState({ isOpen: true, productId: p.id, type: 'SALIDA' })} className="p-1.5 rounded-lg" style={{ color: 'var(--warning)', background: 'var(--warning-bg)' }} title="Salida"><ArrowUpFromLine className="w-4 h-4" /></button>
                      <button onClick={async () => { if (confirm(`¿Eliminar ${p.name}?`)) { const res = await deleteProduct(p.id); if (!res.success) alert(res.error); } }} className="p-1.5 rounded-lg" style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }} title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Data Table (desktop) */}
      <div className="hidden md:block rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead
              className="text-xs uppercase border-b"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <tr>
                <th scope="col" className="px-4 py-4 font-semibold">SKU</th>
                <th scope="col" className="px-4 py-4 font-semibold">Producto</th>
                <th scope="col" className="px-4 py-4 font-semibold">Categoría</th>
                <th scope="col" className="px-4 py-4 font-semibold">Depto</th>
                <th scope="col" className="px-4 py-4 font-semibold">Tipo</th>
                <th scope="col" className="px-4 py-4 font-semibold text-center">Stock</th>
                <th scope="col" className="px-4 py-4 font-semibold text-center">Mínimo</th>
                <th scope="col" className="px-4 py-4 font-semibold">Estado</th>
                {role !== 'TECNICO' && <th scope="col" className="px-4 py-4 font-semibold text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={role !== 'TECNICO' ? 9 : 8}
                    className="text-center py-12"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <PackageSearch className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isLowStock = p.stock <= p.minStock;
                  return (
                    <tr
                      key={p.id}
                      className="border-b transition-colors"
                      style={{ borderColor: 'var(--border)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-alt)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {p.sku}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{p.category}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{p.department}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
                          style={{
                            background: 'var(--accent-subtle)',
                            color: 'var(--accent)',
                            borderColor: 'var(--accent-subtle)',
                          }}
                        >
                          {p.itemType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold" style={{ color: 'var(--text-primary)' }}>
                        {p.stock}
                      </td>
                      <td className="px-4 py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                        {p.minStock}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                          style={
                            isLowStock
                              ? { background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger-bg)' }
                              : { background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success-bg)' }
                          }
                        >
                          {isLowStock ? 'Bajo Stock' : 'Suficiente'}
                        </span>
                      </td>
                      {role !== 'TECNICO' && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setMovementState({ isOpen: true, productId: p.id, type: 'ENTRADA' })}
                              className="p-1.5 rounded-lg transition-colors border border-transparent"
                              title="Registrar Entrada"
                              style={{ color: 'var(--success)' }}
                              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--success-bg)')}
                              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
                            >
                              <ArrowDownToLine className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setMovementState({ isOpen: true, productId: p.id, type: 'SALIDA' })}
                              className="p-1.5 rounded-lg transition-colors border border-transparent"
                              title="Registrar Salida"
                              style={{ color: 'var(--warning)' }}
                              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--warning-bg)')}
                              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
                            >
                              <ArrowUpFromLine className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`¿Eliminar producto ${p.name}?`)) {
                                  const res = await deleteProduct(p.id);
                                  if (!res.success) alert(res.error);
                                }
                              }}
                              className="p-1.5 rounded-lg transition-colors border border-transparent"
                              title="Eliminar Producto"
                              style={{ color: 'var(--danger)' }}
                              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--danger-bg)')}
                              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
                            >
                              <Trash2 className="w-4 h-4" />
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
