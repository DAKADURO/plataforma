/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Briefcase, Mail, Phone, MapPin,
  Users, Receipt, FileText, CheckCircle2, AlertTriangle, AlertOctagon,
} from 'lucide-react';

type ProjectTask = { id: string; status: string };

type Project = {
  id: string;
  name: string;
  status: string;
  progress: number;
  _count: { departments: number; documents: number };
  departments: { tasks: ProjectTask[] }[];
};

type Client = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  rfc: string | null;
  address: string | null;
  projects: Project[];
};

export default function ClientDetailClient({ client, role }: { client: Client; role: string }) {
  const initials = client.name.substring(0, 2).toUpperCase();

  const totalProjects = client.projects.length;
  const activeProjects = client.projects.filter(p => p.status === 'NORMAL' || p.status === 'RIESGO').length;
  const blockedProjects = client.projects.filter(p => p.status === 'ATORADO').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back link */}
      <Link
        href="/clientes"
        className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border transition-colors"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Volver al Directorio
      </Link>

      {/* Client Header */}
      <div className="rounded-3xl p-8 border relative overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: 'var(--accent)' }} />

        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
          >
            <span className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{initials}</span>
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>{client.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {client.rfc && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                  <Receipt className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <span className="uppercase tracking-wider font-bold" style={{ color: 'var(--text-primary)' }}>{client.rfc}</span>
                </div>
              )}
              {client.contact && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{client.contact}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex gap-4 md:ml-auto w-full md:w-auto mt-6 md:mt-0">
            <div className="rounded-2xl p-4 flex-1 md:w-32 flex flex-col items-center justify-center border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
              <span className="text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{activeProjects}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: 'var(--text-muted)' }}>Proyectos<br />Activos</span>
            </div>
            {blockedProjects > 0 && (
              <div className="rounded-2xl p-4 flex-1 md:w-32 flex flex-col items-center justify-center border bg-rose-500/10 border-rose-500/20">
                <span className="text-3xl font-black text-rose-500 mb-1">{blockedProjects}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-center text-rose-400">Proyectos<br />Atorados</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
          {[
            { icon: <Mail className="w-4 h-4" style={{ color: 'var(--accent)' }} />, label: 'Correo', value: client.email, href: `mailto:${client.email}` },
            { icon: <Phone className="w-4 h-4" style={{ color: '#10b981' }} />, label: 'Teléfono', value: client.phone, href: `tel:${client.phone}` },
            { icon: <MapPin className="w-4 h-4" style={{ color: '#ef4444' }} />, label: 'Ubicación', value: client.address },
          ].map(({ icon, label, value, href }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                {icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</span>
                {href && value ? (
                  <a href={href} className="font-medium truncate transition-colors" style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  >
                    {value}
                  </a>
                ) : (
                  <span className="font-medium line-clamp-2" style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: value ? 'normal' : 'italic' }}>
                    {value || 'No registrado'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Briefcase className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            Proyectos del Cliente
          </h2>
        </div>

        {totalProjects === 0 ? (
          <div className="border border-dashed rounded-3xl p-12 text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Sin proyectos activos</p>
            <p className="text-sm">Este cliente aún no tiene proyectos registrados en la plataforma.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {client.projects.map(project => {
              const isAtorado = project.status === 'ATORADO';
              const isRiesgo = project.status === 'RIESGO';

              const statusColor = isAtorado ? 'text-rose-500' : isRiesgo ? 'text-amber-500' : 'text-emerald-500';
              const statusBg = isAtorado ? 'bg-rose-500/10' : isRiesgo ? 'bg-amber-500/10' : 'bg-emerald-500/10';
              const statusBorder = isAtorado ? 'border-rose-500/20' : isRiesgo ? 'border-amber-500/20' : 'border-emerald-500/20';
              const barColor = isAtorado ? '#ef4444' : isRiesgo ? '#f59e0b' : 'var(--accent)';

              return (
                <Link
                  href={`/proyectos/${project.id}`}
                  key={project.id}
                  className="rounded-3xl p-6 flex flex-col group transition-colors relative overflow-hidden border"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-focus)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
                >
                  <div className="absolute top-0 left-0 w-full h-0.5 opacity-30 group-hover:opacity-100 transition-opacity" style={{ background: barColor }} />

                  <div className="flex justify-between items-start mb-6">
                    <h3
                      className="text-lg font-bold mb-2 transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    >
                      {project.name}
                    </h3>

                    <div className={`px-3 py-1.5 rounded-lg border ${statusBg} ${statusBorder} flex items-center gap-1.5 shrink-0`}>
                      {isAtorado ? <AlertOctagon className={`w-3.5 h-3.5 ${statusColor}`} />
                        : isRiesgo ? <AlertTriangle className={`w-3.5 h-3.5 ${statusColor}`} />
                        : <CheckCircle2 className={`w-3.5 h-3.5 ${statusColor}`} />}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>{project.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Avance</span>
                    <span className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{project.progress}%</span>
                  </div>
                  <div className="w-full rounded-full h-1.5 overflow-hidden mb-6" style={{ background: 'var(--bg-surface-alt)' }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${project.progress}%`, background: barColor }} />
                  </div>

                  <div className="mt-auto flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                        {project.departments.reduce((acc, d) => acc + d.tasks.length, 0)} Tareas
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                        <FileText className="w-3 h-3 text-cyan-500" />
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{project._count.documents} Docs</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
