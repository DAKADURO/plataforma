'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, CheckCircle, Clock, XCircle, Package, Truck, Calendar, ShoppingCart, Trash2 } from 'lucide-react';
import { updateRestockOrderStatus, receiveRestockOrder, deleteRestockOrder, generateAutoRestock } from '@/app/actions/restock';
import Button from '@/components/ui/Button';

type RestockOrder = {
  id: string;
  status: string;
  createdAt: Date;
  receivedAt: Date | null;
  supplier: string | null;
  notes: string | null;
  user: { email: string };
  items: {
    id: string;
    quantity: number;
    unitCost: number;
    product: {
      sku: string;
      name: string;
      stock: number;
      minStock: number;
    }
  }[];
};

export default function RestockManager({ orders, role }: { orders: RestockOrder[], role: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<RestockOrder | null>(null);
  const [generating, setGenerating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const isAdmin = role === 'ADMIN' || role === 'GERENTE';

  const refresh = () => startTransition(() => router.refresh());

  const handleGenerateAuto = async () => {
    if (!confirm('¿Deseas generar una Orden de Reposición automática con todos los productos en stock bajo?')) return;
    setGenerating(true);
    const res = await generateAutoRestock();
    setGenerating(false);
    if (res.success) {
      alert('Orden generada con éxito.');
      refresh();
    } else {
      alert(res.error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(true);
    const res = await updateRestockOrderStatus(id, newStatus);
    setUpdating(false);
    if (res.success) {
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      refresh();
    } else {
      alert(res.error);
    }
  };

  const handleReceive = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas marcar esta orden como RECIBIDA? Esto sumará automáticamente las cantidades al inventario global de la empresa.')) return;
    setUpdating(true);
    const res = await receiveRestockOrder(id);
    setUpdating(false);
    if (res.success) {
      alert('Inventario actualizado automáticamente.');
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'RECIBIDA', receivedAt: new Date() } : null);
      }
      refresh();
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta orden por completo?')) return;
    const res = await deleteRestockOrder(id);
    if (res.success) {
      setSelectedOrder(null);
      refresh();
    } else {
      alert(res.error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'BORRADOR': return <Clock className="w-5 h-5 text-gray-400" />;
      case 'EN_TRANSITO': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'RECIBIDA': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'CANCELADA': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BORRADOR': return 'var(--text-muted)';
      case 'EN_TRANSITO': return '#3b82f6';
      case 'RECIBIDA': return '#10b981';
      case 'CANCELADA': return '#ef4444';
      default: return 'var(--text-primary)';
    }
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Órdenes
          </button>
          
          <div className="flex gap-2">
            {isAdmin && selectedOrder.status === 'BORRADOR' && (
              <Button onClick={() => handleStatusChange(selectedOrder.id, 'EN_TRANSITO')} disabled={updating} variant="primary">
                <Truck className="w-4 h-4 mr-2" /> Marcar En Tránsito
              </Button>
            )}
            {isAdmin && selectedOrder.status === 'EN_TRANSITO' && (
              <button onClick={() => handleReceive(selectedOrder.id)} disabled={updating} className="flex items-center px-4 py-2 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-50" style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>
                <CheckCircle className="w-4 h-4 mr-2" /> Recibir e Ingresar Almacén
              </button>
            )}
            {isAdmin && selectedOrder.status !== 'RECIBIDA' && (
              <button onClick={() => handleDelete(selectedOrder.id)} className="p-2 rounded-lg transition-colors border border-transparent hover:bg-red-500/10 hover:text-red-500 text-gray-500">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Orden de Reposición
                  </h2>
                  <p className="text-sm font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                    {selectedOrder.id.toUpperCase().split('-')[0]}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold bg-opacity-10" style={{ borderColor: getStatusColor(selectedOrder.status), color: getStatusColor(selectedOrder.status) }}>
                  {getStatusIcon(selectedOrder.status)}
                  {selectedOrder.status.replace('_', ' ')}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <tr>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3 text-center">Cantidad a Pedir</th>
                      <th className="px-4 py-3 text-right">Costo Est. Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map(item => (
                      <tr key={item.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{item.product.sku}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.product.name}
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Stock actual: {item.product.stock} (Mín: {item.product.minStock})
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold" style={{ color: 'var(--text-primary)' }}>
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>
                          ${(item.quantity * item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t font-bold" style={{ borderColor: 'var(--border)' }}>
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">Costo Estimado Total:</td>
                      <td className="px-4 py-3 text-right text-lg">
                        ${selectedOrder.items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Detalles de la Orden</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Generada por</p>
                  <p className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{selectedOrder.user.email}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Fecha de Creación</p>
                  <p className="font-medium mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedOrder.createdAt).toLocaleDateString()} {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {selectedOrder.receivedAt && (
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Fecha de Recepción</p>
                    <p className="font-medium mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {new Date(selectedOrder.receivedAt).toLocaleDateString()} {new Date(selectedOrder.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
                {selectedOrder.notes && (
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Notas</p>
                    <p className="mt-0.5 p-3 rounded bg-black/10" style={{ color: 'var(--text-secondary)' }}>{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center p-6 rounded-2xl border shadow-[var(--shadow-sm)]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Órdenes de Reposición</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Gestiona las compras internas para reabastecer el almacén</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          {isAdmin && (
            <button
              onClick={handleGenerateAuto}
              disabled={generating}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:-translate-y-px active:translate-y-0 disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              <ShoppingCart className="w-5 h-5" />
              {generating ? 'Generando...' : 'Auto-Generar (Bajo Stock)'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-12 border border-dashed rounded-xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
            No hay órdenes de reposición registradas.
          </div>
        ) : (
          orders.map(order => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className="p-5 rounded-xl border transition-all cursor-pointer hover:-translate-y-1 hover:shadow-lg" 
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-black/10" style={{ color: 'var(--text-secondary)' }}>
                  #{order.id.toUpperCase().split('-')[0]}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: getStatusColor(order.status) }}>
                  {getStatusIcon(order.status)}
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-1 mb-4">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{order.items.length} productos solicitados</p>
                <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="w-3 h-3" /> {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Por: {order.user.email}</span>
                <span className="text-sm font-bold text-right" style={{ color: 'var(--text-primary)' }}>
                  ${order.items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
