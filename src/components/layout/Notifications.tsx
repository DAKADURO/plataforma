'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, AlertTriangle } from 'lucide-react';

type Notification = {
  id: string;
  projectId: string;
  projectName: string;
  status: string;
  time: Date;
};

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    // Escuchar cambios en la tabla 'Project'
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Project',
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;
          
          if (newStatus !== oldStatus && (newStatus === 'ATORADO' || newStatus === 'RIESGO')) {
            const newNotif: Notification = {
              id: Date.now().toString(),
              projectId: payload.new.id,
              projectName: payload.new.name,
              status: newStatus,
              time: new Date()
            };
            setNotifications(prev => [newNotif, ...prev].slice(0, 5));
            setUnread(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnread(0);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white dark:border-[#111]"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop invisible for closing on click outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 z-50 overflow-hidden animate-in slide-in-from-top-2">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notificaciones</h3>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                  No hay notificaciones recientes.
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="p-4 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-default">
                    <div className="flex gap-3">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.status === 'ATORADO' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {n.status === 'ATORADO' ? 'Proyecto Atorado' : 'Proyecto en Riesgo'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          El proyecto <span className="font-semibold text-slate-700 dark:text-slate-300">{n.projectName}</span> cambió su estado.
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
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
