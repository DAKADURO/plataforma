'use client';

import { useState, useEffect } from 'react';
import { X, Palette, Trash2, Plus } from 'lucide-react';
import { createTag, updateTag, deleteTag, getTags } from '@/app/actions/tags';
import TagBadge from './TagBadge';

type Tag = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  _count?: { products: number };
};

const PRESET_COLORS = ['#3b82f6', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#ef4444', '#6366f1'];

export default function TagManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({ name: '', description: '', color: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen]);

  const loadTags = async () => {
    setLoading(true);
    const res = await getTags();
    if (res.success) {
      setTags(res.tags || []);
    }
    setLoading(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = editingId
      ? await updateTag(editingId, form)
      : await createTag(form);

    setSubmitting(false);

    if (res.success) {
      await loadTags();
      setForm({ name: '', description: '', color: '' });
      setEditingId(null);
    } else {
      setError(res.error || 'Error al guardar etiqueta.');
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!confirm('¿Eliminar esta etiqueta? Se desvinculará de todos los productos.')) return;
    const res = await deleteTag(tagId);
    if (res.success) {
      await loadTags();
    } else {
      setError(res.error || 'Error al eliminar.');
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setForm({ name: tag.name, description: tag.description || '', color: tag.color || '' });
  };

  const resetForm = () => {
    setForm({ name: '', description: '', color: '' });
    setEditingId(null);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Gestor de Etiquetas</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          {/* Create/Edit Form */}
          <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              {editingId ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
            </h3>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              {error && (
                <div className="p-3 text-sm rounded-lg" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Nombre *</label>
                <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Tornillos, Importado, Crítico"
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Descripción</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción breve (opcional)"
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Palette className="w-3 h-3" /> Color
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color }))}
                      className="w-8 h-8 rounded-lg border-2 transition-all"
                      style={{
                        background: color,
                        borderColor: form.color === color ? 'var(--text-primary)' : 'transparent'
                      }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-8 rounded-lg border" style={{ background: form.color || 'var(--bg-surface-alt)', borderColor: 'var(--border)' }} />
                  <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="#3b82f6"
                    className="flex-1 px-2 py-1 text-xs rounded-lg outline-none"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}>
                  {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tags List */}
          {loading ? (
            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>Cargando...</p>
          ) : tags.length === 0 ? (
            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>No hay etiquetas. Crea una arriba.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Etiquetas ({tags.length})
              </p>
              {tags.map(tag => (
                <div key={tag.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TagBadge id={tag.id} name={tag.name} color={tag.color} />
                      {tag._count && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {tag._count.products} {tag._count.products === 1 ? 'producto' : 'productos'}
                        </span>
                      )}
                    </div>
                    {tag.description && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tag.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={() => startEdit(tag)}
                      className="px-2 py-1 text-xs rounded transition-colors"
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                      Editar
                    </button>
                    <button onClick={() => handleDelete(tag.id)}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
