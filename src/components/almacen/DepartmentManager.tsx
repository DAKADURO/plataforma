'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, FolderOpen, Wind, Zap, Droplets, HardHat, Monitor, Wrench, Settings, Search, CheckCircle, Package } from 'lucide-react';
import { createDepartment, deleteDepartment, updateDepartment } from '@/app/actions/departments';
import Button from '@/components/ui/Button';

// Lista de iconos disponibles para el usuario
const AVAILABLE_ICONS = [
  { name: 'FolderOpen', component: FolderOpen },
  { name: 'Wind', component: Wind },
  { name: 'Zap', component: Zap },
  { name: 'Droplets', component: Droplets },
  { name: 'HardHat', component: HardHat },
  { name: 'Monitor', component: Monitor },
  { name: 'Wrench', component: Wrench },
  { name: 'Settings', component: Settings },
  { name: 'Package', component: Package },
];

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#ef4444', // Red
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#64748b', // Slate
];

type Department = {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId: string | null;
  children: Department[];
  _count?: { products: number };
};

export default function DepartmentManager({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('FolderOpen');
  const [color, setColor] = useState('#3b82f6');
  const [parentId, setParentId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = () => startTransition(() => router.refresh());

  const openNewModal = (parent?: string) => {
    setEditingDept(null);
    setName('');
    setIcon('FolderOpen');
    setColor('#3b82f6');
    setParentId(parent || '');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setIcon(dept.icon);
    setColor(dept.color);
    setParentId(dept.parentId || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const data = { name, icon, color, parentId: parentId || undefined };
    
    let res;
    if (editingDept) {
      res = await updateDepartment(editingDept.id, data);
    } else {
      res = await createDepartment(data);
    }

    setSaving(false);

    if (res.success) {
      setIsModalOpen(false);
      refresh();
    } else {
      setError(res.error || 'Ocurrió un error al guardar');
    }
  };

  const handleDelete = async (id: string, name: string, productCount?: number) => {
    let message = `¿Estás seguro de eliminar el departamento "${name}"?`;
    if (productCount && productCount > 0) {
      message += `\n\n⚠️ Hay ${productCount} producto(s) asignado(s) a este departamento. No se puede eliminar hasta reasignarlos.`;
    }
    if (!confirm(message)) return;

    const res = await deleteDepartment(id);
    if (res.success) {
      refresh();
    } else {
      alert(res.error);
    }
  };

  // Icon Resolver Component
  const IconResolver = ({ iconName, color }: { iconName: string, color: string }) => {
    const iconDef = AVAILABLE_ICONS.find(i => i.name === iconName) || AVAILABLE_ICONS[0];
    const IconComponent = iconDef.component;
    return <IconComponent className="w-5 h-5" style={{ color }} />;
  };

  // Solo deptos principales
  const mainDepartments = departments.filter(d => !d.parentId);

  return (
    <div className="space-y-6 animate-fade-in">
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
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Departamentos y Áreas</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Configura la estructura de áreas para organizar tus productos.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Button onClick={() => openNewModal()} variant="primary">
            <Plus className="w-5 h-5 mr-2" /> Nuevo Departamento
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {mainDepartments.map(dept => (
          <div key={dept.id} className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="p-4 flex items-center justify-between border-b bg-black/5" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                  <IconResolver iconName={dept.icon} color={dept.color} />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{dept.name}</h3>
                  {dept._count && dept._count.products > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {dept._count.products} producto{dept._count.products !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openNewModal(dept.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  + Subdivisión
                </button>
                <button onClick={() => openEditModal(dept)} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  <Settings className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(dept.id, dept.name, dept._count?.products)} className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {dept.children.length > 0 && (
              <div className="p-4 bg-black/5 flex gap-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
                {dept.children.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white dark:bg-[#1a1a1a]" style={{ borderColor: 'var(--border)' }}>
                    <IconResolver iconName={sub.icon} color={sub.color} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{sub.name}</span>
                    <button onClick={() => openEditModal(sub)} className="ml-2 hover:opacity-70"><Settings className="w-3 h-3 text-gray-400" /></button>
                    <button onClick={() => handleDelete(sub.id, sub.name)} className="ml-1 hover:text-red-500"><Trash2 className="w-3 h-3 text-gray-400" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {mainDepartments.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            No hay departamentos configurados.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingDept ? 'Editar Departamento' : 'Nuevo Departamento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Nombre</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none"
                  style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Es subdivisión de (Opcional)</label>
                <select value={parentId} onChange={e => setParentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none"
                  style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  <option value="">-- Ninguno (Es principal) --</option>
                  {mainDepartments.filter(d => d.id !== editingDept?.id).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center" style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'transparent', boxShadow: color === c ? '0 0 0 2px var(--accent)' : 'none' }}>
                      {color === c && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Icono</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map(i => {
                    const IconComp = i.component;
                    return (
                      <button key={i.name} type="button" onClick={() => setIcon(i.name)} className="p-3 rounded-lg border flex justify-center items-center transition-colors"
                        style={{ 
                          background: icon === i.name ? 'var(--accent-subtle)' : 'var(--bg-surface-alt)',
                          borderColor: icon === i.name ? 'var(--accent)' : 'var(--border)',
                          color: icon === i.name ? 'var(--accent)' : 'var(--text-secondary)'
                        }}>
                        <IconComp className="w-6 h-6" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                <Button type="submit" disabled={saving} variant="primary">
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
