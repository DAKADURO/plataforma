'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

type FilterState = {
  categories: string[];
  departments: string[];
  itemTypes: string[];
  stockMin: number;
  stockMax: number;
};

const DEPARTMENTS = ['General', 'HVAC', 'Eléctrico', 'Plomería', 'Civil', 'Sistemas'];
const ITEM_TYPES = ['Consumible', 'Herramienta', 'Material', 'Equipo'];

export default function AdvancedFilterPanel({
  allCategories,
  filters,
  onFilterChange,
}: {
  allCategories: string[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleCategory = (cat: string) => {
    const cats = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    onFilterChange({ ...filters, categories: cats });
  };

  const handleToggleDepartment = (dept: string) => {
    const depts = filters.departments.includes(dept)
      ? filters.departments.filter(d => d !== dept)
      : [...filters.departments, dept];
    onFilterChange({ ...filters, departments: depts });
  };

  const handleToggleItemType = (type: string) => {
    const types = filters.itemTypes.includes(type)
      ? filters.itemTypes.filter(t => t !== type)
      : [...filters.itemTypes, type];
    onFilterChange({ ...filters, itemTypes: types });
  };

  const handleStockChange = (min: number, max: number) => {
    onFilterChange({ ...filters, stockMin: min, stockMax: max });
  };

  const handleClearFilters = () => {
    onFilterChange({
      categories: [],
      departments: [],
      itemTypes: [],
      stockMin: 0,
      stockMax: 99999,
    });
  };

  const activeFiltersCount =
    filters.categories.length + filters.departments.length + filters.itemTypes.length +
    (filters.stockMin > 0 || filters.stockMax < 99999 ? 1 : 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border transition-all"
        style={{
          background: activeFiltersCount > 0 ? 'var(--accent-subtle)' : 'var(--bg-surface-alt)',
          borderColor: isOpen ? 'var(--border-focus)' : 'var(--border)',
          color: activeFiltersCount > 0 ? 'var(--accent)' : 'var(--text-secondary)',
        }}
      >
        <span className="font-medium">🔍 Filtros avanzados</span>
        {activeFiltersCount > 0 && (
          <span className="px-2 py-0.5 text-xs rounded-full" style={{ background: 'var(--accent)', color: '#fff' }}>
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown
          className="w-4 h-4 transition-transform"
          style={{ transform: isOpen ? 'rotateZ(180deg)' : '' }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full mt-2 left-0 z-40 rounded-xl border shadow-2xl min-w-96"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <div className="sticky top-0 px-4 py-3 border-b flex items-center justify-between"
            style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Filtros Avanzados</h3>
            {activeFiltersCount > 0 && (
              <button onClick={handleClearFilters} className="text-xs font-medium"
                style={{ color: 'var(--accent)' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Limpiar todo
              </button>
            )}
          </div>

          <div className="p-4 space-y-5">
            {/* Categories */}
            {allCategories.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Categorías ({filters.categories.length})
                </p>
                <div className="space-y-1.5">
                  {allCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(cat)}
                        onChange={() => handleToggleCategory(cat)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Departments */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Departamentos ({filters.departments.length})
              </p>
              <div className="space-y-1.5">
                {DEPARTMENTS.map(dept => (
                  <label key={dept} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.departments.includes(dept)}
                      onChange={() => handleToggleDepartment(dept)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{dept}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Item Types */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Tipos ({filters.itemTypes.length})
              </p>
              <div className="space-y-1.5">
                {ITEM_TYPES.map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.itemTypes.includes(type)}
                      onChange={() => handleToggleItemType(type)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stock Range */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Rango de Stock
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Mínimo: {filters.stockMin}</label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.stockMin}
                    onChange={e => handleStockChange(parseInt(e.target.value), filters.stockMax)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Máximo: {filters.stockMax === 99999 ? '∞' : filters.stockMax}</label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.stockMax === 99999 ? 1000 : filters.stockMax}
                    onChange={e => handleStockChange(filters.stockMin, parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
