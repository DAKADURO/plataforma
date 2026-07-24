'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, AlertTriangle, Receipt } from 'lucide-react';
import Link from 'next/link';

type Notification = {
  id: string;
  projectId: string;
  projectName: string;
  status: string;
  time: Date;
};

type PaymentAlert = { id: string; concept: string; amount: number; dueDate: Date | null; projectId: string; projectName: string };

export default function Notifications({ paymentAlerts = [] }: { paymentAlerts?: PaymentAlert[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(paymentAlerts.length);

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Project' },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;
          if (newStatus !== oldStatus && (newStatus === 'ATORADO' || newStatus === 'RIESGO')) {
            setNotifications(prev => [{
              id: Date.now().toString(),
              projectId: payload.new.id,
              projectName: payload.new.name,
              status: newStatus,
              time: new Date(),
            }, ...prev].slice(0, 5));
            setUnread(prev => prev + 1);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setUnread(0);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="p-2 rounded-xl transition-colors relative"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--danger)' }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: 'var(--danger)' }} />
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-80 rounded-2xl shadow-[var(--shadow-lg)] border z-50 overflow-hidden animate-slide-down"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-alt)' }}
            >
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Notificaciones</h3>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {paymentAlerts.map(p => {
                const isOverdue = p.dueDate && new Date(p.dueDate) < new Date();
                return (
                  <Link
                    key={p.id}
                    href={`/proyectos/${p.projectId}`}
                    className="block p-4 border-b transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex gap-3">
                      <div
                        className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={isOverdue
                          ? { background: 'var(--danger-bg)', color: 'var(--danger)' }
                          : { background: 'var(--warning-bg)', color: 'var(--warning)' }
                        }
                      >
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {isOverdue ? 'Cobro vencido' : 'Cobro próximo a vencer'}
                        </p>
                        <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-semibold">{p.projectName}</span> · {p.concept} · ${p.amount.toLocaleString()}
                        </p>
                        {p.dueDate && (
                          <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                            Vence: {new Date(p.dueDate).toLocaleDateString('es-MX', { timeZone: 'UTC' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}

              {notifications.length === 0 && paymentAlerts.length === 0 ? (
                <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No hay notificaciones recientes.
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className="p-4 border-b transition-colors cursor-default"
                    style={{ borderColor: 'var(--border)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-alt)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
                  >
                    <div className="flex gap-3">
                      <div
                        className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={
                          n.status === 'ATORADO'
                            ? { background: 'var(--danger-bg)', color: 'var(--danger)' }
                            : { background: 'var(--warning-bg)', color: 'var(--warning)' }
                        }
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {n.status === 'ATORADO' ? 'Proyecto Atorado' : 'Proyecto en Riesgo'}
                        </p>
                        <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-semibold">{n.projectName}</span> cambió su estado.
                        </p>
                        <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                          {n.time.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
