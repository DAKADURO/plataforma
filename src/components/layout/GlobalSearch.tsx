'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, Briefcase, Package, Settings, X, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { globalSearch, SearchResult } from '@/app/actions/search';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setTimeout(() => {
        setQuery('');
        setResults([]);
      }, 0);
    }
  }, [isOpen]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await globalSearch(query);
          setResults(res);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    router.push(url);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'CLIENTE': return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'PROYECTO': return <Briefcase className="w-5 h-5 text-purple-400" />;
      case 'PRODUCTO': return <Package className="w-5 h-5 text-amber-400" />;
      case 'MAQUINA': return <Settings className="w-5 h-5 text-emerald-400" />;
      default: return <Search className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <>
      {/* ── Trigger Button ── */}
      <div 
        onClick={() => setIsOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm cursor-text hover:bg-white/10 transition-colors"
        style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-muted)' }}
      >
        <Search className="w-3.5 h-3.5" />
        <span>Buscar…</span>
        <kbd className="text-[10px] px-1 rounded font-sans font-bold" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>⌘K</kbd>
      </div>

      {/* Mobile trigger (icon only) */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 rounded-xl transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Search className="w-5 h-5" />
      </button>

      {/* ── Search Modal ── */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div
            className="relative w-full max-w-2xl rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden flex flex-col border animate-fade-in"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Busca clientes, proyectos, productos o máquinas..."
                className="flex-1 bg-transparent border-none text-base focus:outline-none focus:ring-0"
                style={{ color: 'var(--text-primary)' }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {loading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Body */}
            <div className="max-h-[60vh] overflow-y-auto p-2 min-h-[260px]">
              {query.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
                    style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                  >
                    <Search className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Comienza a escribir para buscar</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Clientes, proyectos, productos o máquinas</p>
                </div>
              )}

              {query.length > 0 && query.length < 2 && (
                <div className="py-12 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                  Escribe al menos 2 letras para buscar...
                </div>
              )}

              {query.length >= 2 && !loading && results.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Search className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Sin resultados</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Prueba con otras palabras.</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-0.5">
                  {results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result.url)}
                      className="w-full flex items-center justify-between gap-4 p-3 rounded-xl transition-colors group text-left"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-alt)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                        >
                          {getIconForType(result.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{result.title}</span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest uppercase"
                              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                            >
                              {result.type}
                            </span>
                          </div>
                          <span className="text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>{result.subtitle}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" style={{ color: 'var(--accent)' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              className="px-5 py-3 border-t flex justify-between items-center text-xs"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-alt)', color: 'var(--text-muted)' }}
            >
              <span className="font-medium">Directorio Memrit Sears</span>
              <span>ESC para cerrar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
