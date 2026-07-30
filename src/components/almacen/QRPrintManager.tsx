'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Search, CheckSquare, Square } from 'lucide-react';
import QRLabel from './QRLabel';
import Button from '@/components/ui/Button';

type Product = { id: string; sku: string; name: string; department: string; };

export default function QRPrintManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedProducts = products.filter(p => selectedIds.has(p.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 2mm;
            padding: 0;
            margin: 0;
          }
          @page { margin: 5mm; }
        }
      `}} />

      <div className="flex flex-col md:flex-row justify-between items-center p-6 rounded-2xl border shadow-[var(--shadow-sm)]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div>
          <button 
            onClick={() => router.push('/almacen')}
            className="flex items-center gap-2 mb-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Almacén
          </button>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Generador de Etiquetas QR</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Selecciona los productos y mándalos a imprimir para etiquetar físicamente el inventario.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handlePrint} disabled={selectedIds.size === 0} variant="primary">
            <Printer className="w-5 h-5 mr-2" /> Imprimir ({selectedIds.size})
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por SKU o nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <button onClick={selectAll} className="flex items-center gap-2 text-sm font-bold p-2" style={{ color: 'var(--accent)' }}>
          {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
          Seleccionar Todos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => {
          const isSelected = selectedIds.has(p.id);
          return (
            <div 
              key={p.id}
              onClick={() => toggleSelect(p.id)}
              className="p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
              style={{
                background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <div>
                <p className="font-bold text-sm line-clamp-1" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>{p.sku}</p>
              </div>
              <div style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>
                {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Área oculta que solo se muestra al imprimir */}
      <div id="print-area" className="hidden">
        {selectedProducts.map(p => (
          <QRLabel key={p.id} sku={p.sku} name={p.name} department={p.department} />
        ))}
      </div>
    </div>
  );
}
