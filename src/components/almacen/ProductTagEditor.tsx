'use client';

import { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { addTagToProduct, removeTagFromProduct } from '@/app/actions/tags';
import TagBadge from './TagBadge';

type Tag = {
  id: string;
  name: string;
  color?: string;
  _count?: { products: number };
};

type ProductTag = {
  tag: Tag;
};

export default function ProductTagEditor({
  productId,
  currentTags,
  allTags,
  onUpdate,
}: {
  productId: string;
  currentTags: ProductTag[];
  allTags: Tag[];
  onUpdate?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const currentTagIds = new Set(currentTags.map(pt => pt.tag.id));
  const availableTags = allTags.filter(t => !currentTagIds.has(t.id));

  const handleRemove = async (tagId: string) => {
    setIsRemoving(tagId);
    const res = await removeTagFromProduct(productId, tagId);
    if (res.success) {
      onUpdate?.();
    }
    setIsRemoving(null);
  };

  const handleAdd = async (tagId: string) => {
    setIsAdding(tagId);
    const res = await addTagToProduct(productId, tagId);
    if (res.success) {
      onUpdate?.();
    }
    setIsAdding(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          Etiquetas
        </label>
        {currentTags.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            {currentTags.length}
          </span>
        )}
      </div>

      {/* Current tags */}
      {currentTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 rounded-lg" style={{ background: 'var(--bg-surface-alt)' }}>
          {currentTags.map(pt => (
            <TagBadge
              key={pt.tag.id}
              id={pt.tag.id}
              name={pt.tag.name}
              color={pt.tag.color}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Add tags dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-colors"
          style={{
            background: 'var(--bg-surface-alt)',
            borderColor: isOpen ? 'var(--border-focus)' : 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            {availableTags.length > 0 ? 'Agregar etiqueta' : 'Sin etiquetas disponibles'}
          </span>
          <ChevronDown
            className="w-4 h-4 transition-transform"
            style={{ transform: isOpen ? 'rotateZ(180deg)' : '' }}
          />
        </button>

        {isOpen && availableTags.length > 0 && (
          <div
            className="absolute top-full mt-1 w-full z-40 rounded-lg border shadow-lg max-h-48 overflow-y-auto"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            {availableTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => {
                  handleAdd(tag.id);
                  if (availableTags.length === 1) setIsOpen(false);
                }}
                disabled={isAdding === tag.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-opacity-50 transition-colors flex items-center justify-between"
                style={{
                  background: isAdding === tag.id ? 'var(--bg-surface-alt)' : '',
                  color: 'var(--text-primary)',
                }}
              >
                <span className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: tag.color || 'var(--accent)' }}
                  />
                  {tag.name}
                </span>
                {tag._count && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {tag._count.products}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
