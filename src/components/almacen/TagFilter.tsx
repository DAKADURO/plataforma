'use client';

import { useState } from 'react';
import { Filter, X, Settings } from 'lucide-react';
import TagBadge from './TagBadge';

type Tag = {
  id: string;
  name: string;
  color?: string;
  _count?: { products: number };
};

export default function TagFilter({
  tags,
  selectedTags,
  onTagsChange,
  onManageTags,
}: {
  tags: Tag[];
  selectedTags: string[];
  onTagsChange: (tagIds: string[]) => void;
  onManageTags: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleClear = () => {
    onTagsChange([]);
  };

  const selectedTagObjects = tags.filter(t => selectedTags.includes(t.id));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Selected tags display */}
      {selectedTagObjects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {selectedTagObjects.map(tag => (
            <TagBadge
              key={tag.id}
              id={tag.id}
              name={tag.name}
              color={tag.color}
              onRemove={() => handleToggleTag(tag.id)}
            />
          ))}
          <button
            onClick={handleClear}
            className="text-xs px-2 py-1 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            Limpiar
          </button>
        </div>
      )}

      {/* Filter button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors"
          style={{
            background: selectedTags.length > 0 ? 'var(--accent-subtle)' : 'var(--bg-surface-alt)',
            borderColor: isOpen ? 'var(--border-focus)' : 'var(--border)',
            color: selectedTags.length > 0 ? 'var(--accent)' : 'var(--text-secondary)',
          }}
        >
          <Filter className="w-4 h-4" />
          Filtrar por etiqueta
          {selectedTags.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full" style={{ background: 'var(--accent)', color: '#fff' }}>
              {selectedTags.length}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            className="absolute top-full mt-1 w-80 z-40 rounded-xl border shadow-lg max-h-96 overflow-y-auto"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="p-3 border-b flex items-center justify-between sticky top-0 z-50"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Etiquetas ({tags.length})
              </p>
              <button
                onClick={() => onManageTags()}
                className="p-1 rounded transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {tags.length === 0 ? (
              <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No hay etiquetas. Crea una en el gestor.
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {tags.map(tag => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors hover:bg-opacity-50"
                    style={{ background: selectedTags.includes(tag.id) ? 'var(--accent-subtle)' : 'transparent' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => handleToggleTag(tag.id)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: tag.color || 'var(--accent)' }}
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {tag.name}
                        </span>
                      </div>
                    </div>
                    {tag._count && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {tag._count.products}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}

            {selectedTags.length > 0 && (
              <div className="p-3 border-t"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                <button
                  onClick={handleClear}
                  className="w-full px-3 py-1.5 text-xs font-medium rounded transition-colors"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                >
                  Limpiar filtro
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
