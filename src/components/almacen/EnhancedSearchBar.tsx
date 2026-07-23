'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, X } from 'lucide-react';

type Suggestion = {
  type: 'recent' | 'product' | 'tag';
  value: string;
  label: string;
};

export default function EnhancedSearchBar({
  value,
  onChange,
  placeholder = 'Buscar por SKU, nombre o etiqueta...',
  suggestions = [],
  onSuggestionSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: Suggestion[];
  onSuggestionSelect?: (suggestion: Suggestion) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('almacen-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.value);

    // Save to recent if it's a product search
    if (suggestion.type === 'product') {
      const updated = [suggestion.value, ...recentSearches.filter(s => s !== suggestion.value)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('almacen-searches', JSON.stringify(updated));
    }

    onSuggestionSelect?.(suggestion);
    setIsOpen(false);
  };

  const filteredSuggestions = suggestions.filter(s =>
    value.length === 0 ? s.type === 'recent' : s.label.toLowerCase().includes(value.toLowerCase())
  );

  const displaySuggestions =
    value.length === 0
      ? [
          ...recentSearches.map(s => ({ type: 'recent' as const, value: s, label: s })),
          ...filteredSuggestions.filter(s => s.type !== 'recent'),
        ]
      : filteredSuggestions;

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg pl-9 pr-8 py-2.5 text-sm outline-none transition-colors"
          style={{
            background: 'var(--bg-surface-alt)',
            border: `1px solid ${isOpen ? 'var(--border-focus)' : 'var(--border)'}`,
            color: 'var(--text-primary)',
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && displaySuggestions.length > 0 && (
        <div
          className="absolute top-full mt-1 w-full z-40 rounded-lg border shadow-lg max-h-64 overflow-y-auto"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 100)}>
          {displaySuggestions.map((sugg, i) => {
            const Icon = sugg.type === 'recent' ? Clock : sugg.type === 'tag' ? () => '🏷️' : () => '📦';
            return (
              <button
                key={`${sugg.type}-${i}`}
                onClick={() => handleSelect(sugg)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-opacity-50 transition-colors flex items-center gap-3"
                style={{
                  color: 'var(--text-primary)',
                  borderBottom: i < displaySuggestions.length - 1 ? '1px solid var(--border)' : '',
                }}>
                {sugg.type === 'recent' ? (
                  <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                ) : sugg.type === 'tag' ? (
                  <span>🏷️</span>
                ) : (
                  <span>📦</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate">{sugg.label}</p>
                  {sugg.type === 'recent' && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Búsqueda reciente</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
