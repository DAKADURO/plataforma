'use client';

import { X } from 'lucide-react';

type FilterChipsProps = {
  categories?: string[];
  departments?: string[];
  itemTypes?: string[];
  stockMin?: number;
  stockMax?: number;
  tagNames?: { id: string; name: string }[];
  resultCount: number;
  onRemoveCategory?: (cat: string) => void;
  onRemoveDepartment?: (dept: string) => void;
  onRemoveItemType?: (type: string) => void;
  onRemoveStock?: () => void;
  onRemoveTag?: (tagId: string) => void;
  onClearAll?: () => void;
};

export default function FilterChips({
  categories = [],
  departments = [],
  itemTypes = [],
  stockMin = 0,
  stockMax = 99999,
  tagNames = [],
  resultCount,
  onRemoveCategory,
  onRemoveDepartment,
  onRemoveItemType,
  onRemoveStock,
  onRemoveTag,
  onClearAll,
}: FilterChipsProps) {
  const hasFilters =
    categories.length > 0 ||
    departments.length > 0 ||
    itemTypes.length > 0 ||
    (stockMin > 0 || stockMax < 99999) ||
    tagNames.length > 0;

  if (!hasFilters) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Filtros activos • {resultCount} resultado{resultCount !== 1 ? 's' : ''}
        </p>
        {onClearAll && (
          <button
            onClick={onClearAll}
            className="text-xs font-medium px-2 py-1 rounded transition-colors"
            style={{ color: 'var(--accent)' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            Limpiar todo
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Category chips */}
        {categories.map(cat => (
          <div
            key={`cat-${cat}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{
              background: 'var(--bg-surface-alt)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}>
            📁 {cat}
            {onRemoveCategory && (
              <button onClick={() => onRemoveCategory(cat)} className="ml-0.5 p-0.5 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {/* Department chips */}
        {departments.map(dept => (
          <div
            key={`dept-${dept}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{
              background: 'var(--bg-surface-alt)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}>
            🏢 {dept}
            {onRemoveDepartment && (
              <button onClick={() => onRemoveDepartment(dept)} className="ml-0.5 p-0.5 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {/* ItemType chips */}
        {itemTypes.map(type => (
          <div
            key={`type-${type}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{
              background: 'var(--bg-surface-alt)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}>
            📦 {type}
            {onRemoveItemType && (
              <button onClick={() => onRemoveItemType(type)} className="ml-0.5 p-0.5 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {/* Stock range chip */}
        {(stockMin > 0 || stockMax < 99999) && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{
              background: 'var(--bg-surface-alt)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}>
            📊 Stock: {stockMin}-{stockMax === 99999 ? '∞' : stockMax}
            {onRemoveStock && (
              <button onClick={onRemoveStock} className="ml-0.5 p-0.5 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Tag chips */}
        {tagNames.map(tag => (
          <div
            key={`tag-${tag.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{
              background: 'var(--accent-subtle)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
            }}>
            🏷️ {tag.name}
            {onRemoveTag && (
              <button onClick={() => onRemoveTag(tag.id)} className="ml-0.5 p-0.5 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
