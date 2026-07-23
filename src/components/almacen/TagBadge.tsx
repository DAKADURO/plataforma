'use client';

import { X } from 'lucide-react';

type TagBadgeProps = {
  id: string;
  name: string;
  color?: string;
  onRemove?: (tagId: string) => void;
  clickable?: boolean;
  onClick?: () => void;
};

export default function TagBadge({ id, name, color, onRemove, clickable, onClick }: TagBadgeProps) {
  const bgColor = color || 'var(--accent)';
  const textColor = '#fff';

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: bgColor,
        color: textColor,
        opacity: 0.9,
        cursor: clickable ? 'pointer' : 'default'
      }}
      onClick={onClick}
      onMouseEnter={e => {
        if (clickable) (e.currentTarget as HTMLElement).style.opacity = '1';
      }}
      onMouseLeave={e => {
        if (clickable) (e.currentTarget as HTMLElement).style.opacity = '0.9';
      }}
    >
      {name}
      {onRemove && (
        <button
          onClick={e => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="p-0.5 rounded hover:opacity-80 transition-opacity"
          title="Remover etiqueta"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
