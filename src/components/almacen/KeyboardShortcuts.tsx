'use client';

import { useEffect, useState } from 'react';
import { X, Command } from 'lucide-react';

const SHORTCUTS = [
  { key: 'Ctrl+K', description: 'Buscar productos' },
  { key: 'Ctrl+N', description: 'Nuevo producto' },
  { key: 'Ctrl+E', description: 'Exportar datos' },
  { key: 'Ctrl+P', description: 'Imprimir' },
  { key: '?', description: 'Mostrar atajos' },
];

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts with ?
      if (e.key === '?') {
        setIsOpen(!isOpen);
      }

      // Ctrl+K - Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }

      // Ctrl+P - Print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Keyboard shortcut indicator */}
      <div
        className="fixed bottom-6 right-6 text-xs px-2 py-1 rounded-lg cursor-pointer transition-opacity opacity-50 hover:opacity-100 hidden md:block"
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        title="Presiona ? para atajos"
      >
        Presiona <kbd className="font-mono">?</kbd>
      </div>

      {/* Shortcuts modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Atajos de Teclado
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {SHORTCUTS.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span style={{ color: 'var(--text-primary)' }}>{shortcut.description}</span>
                  <kbd
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
                    style={{
                      background: 'var(--bg-surface-alt)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-muted)',
                    }}>
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t text-xs text-center"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Presiona <kbd className="font-mono">?</kbd> nuevamente para cerrar
            </div>
          </div>
        </div>
      )}
    </>
  );
}
