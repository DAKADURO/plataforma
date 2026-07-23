/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus, Building2, Briefcase, Trash2, Edit2, AlertCircle,
  Search, Mail, Phone, Receipt, MapPin, Users, X, ChevronRight,
} from 'lucide-react';
import { createClient, updateClient, deleteClient } from '@/app/actions/clients';

type ClientData = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  rfc: string | null;
  address: string | null;
  _count: { projects: number };
};

type FormState = {
  name: string;
  contact: string;
  email: string;
  phone: string;
  rfc: string;
  address: string;
};

const emptyForm: FormState = { name: '', contact: '', email: '', phone: '', rfc: '', address: '' };

export default function ClientManager({ initialClients, userRole }: { initialClients: ClientData[]; userRole: string }) {
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canEdit = userRole === 'ADMIN' || userRole === 'GERENTE';

  const filtered = clients.filter(c => {
    const term = search.toLowerCase();
    return c.name.toLowerCase().includes(term) || (c.contact || '').toLowerCase().includes(term);
  });

  const openNew = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (client: ClientData) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      contact: client.contact || '',
      email: client.email || '',
      phone: client.phone || '',
      rfc: client.rfc || '',
      address: client.address || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      name: form.name,
      contact: form.contact || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      rfc: form.rfc || undefined,
      address: form.address || undefined,
    };

    if (editingClient) {
      const res = await updateClient(editingClient.id, payload);
      if (res.success) {
        setClients(prev => prev.map(c => c.id === editingClient.id
          ? { ...c, name: form.name, contact: form.contact || null, email: form.email || null, phone: form.phone || null, rfc: form.rfc || null, address: form.address || null }
          : c,
        ));
        setIsModalOpen(false);
      } else {
        setError(res.error || 'Error al actualizar');
      }
    } else {
      const res = await createClient(payload);
      if (res.success) {
        window.location.reload();
      } else {
        setError(res.error || 'Error al crear');
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Eliminar al cliente "${name}"? Esto eliminará también todos sus proyectos.`)) {
      const res = await deleteClient(id);
      if (res.success) {
        setClients(prev => prev.filter(c => c.id !== id));
      } else {
        alert(res.error || 'Error al eliminar');
      }
    }
  };

  const setField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s',
  } as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6 rounded-2xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Directorio de Clientes
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
              Gestión B2B &amp; Portafolio
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none transition-all"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {canEdit && (
            <button
              onClick={openNew}
              className="flex items-center justify-center gap-2 px-6 py-3 text-white rounded-2xl text-sm font-black transition-all whitespace-nowrap"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Plus className="w-4 h-4" />
              Nuevo Cliente
            </button>
          )}
        </div>
      </div>

      {/* Client cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No se encontraron clientes.</p>
          <p className="text-sm">Intenta con otra búsqueda o registra uno nuevo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(client => {
            const initials = client.name.substring(0, 2).toUpperCase();
            return (
              <div
                key={client.id}
                className="rounded-3xl flex flex-col relative group transition-all duration-300 overflow-hidden border"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-focus)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
              >
                {/* Accent top line */}
                <div className="absolute top-0 left-0 w-full h-0.5 opacity-30 group-hover:opacity-100 transition-opacity" style={{ background: 'var(--accent)' }} />

                {/* Header Area */}
                <div className="p-6 pb-4 flex gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform"
                    style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    <span className="text-lg font-black">{initials}</span>
                  </div>
                  <div className="min-w-0 pt-1">
                    <h3
                      className="font-bold text-lg leading-tight truncate transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {client.name}
                    </h3>
                    {client.rfc && (
                      <span className="text-[10px] font-bold uppercase tracking-widest mt-1 block" style={{ color: 'var(--text-muted)' }}>
                        RFC: {client.rfc}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {canEdit && (
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={() => openEdit(client)}
                      className="p-2 rounded-xl transition-colors text-white"
                      style={{ background: 'var(--bg-surface-alt)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface-alt)')}
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id, client.name)}
                      className="p-2 rounded-xl transition-colors text-white"
                      style={{ background: 'var(--bg-surface-alt)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface-alt)')}
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Info List */}
                <div className="px-6 py-4 space-y-3 flex-1">
                  {[
                    { icon: <Users className="w-3 h-3" style={{ color: 'var(--accent)' }} />, value: client.contact, placeholder: 'Sin contacto' },
                    { icon: <Mail className="w-3 h-3" style={{ color: 'var(--accent)' }} />, value: client.email, placeholder: 'Sin correo' },
                    { icon: <Phone className="w-3 h-3" style={{ color: '#10b981' }} />, value: client.phone, placeholder: 'Sin teléfono' },
                    { icon: <MapPin className="w-3 h-3" style={{ color: '#ef4444' }} />, value: client.address, placeholder: 'Sin dirección' },
                  ].map(({ icon, value, placeholder }, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--bg-surface-alt)' }}>
                        {icon}
                      </div>
                      <span className="truncate" style={{ color: value ? 'var(--text-secondary)' : 'var(--text-muted)', fontStyle: value ? 'normal' : 'italic' }}>
                        {value || placeholder}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <Link
                  href={`/clientes/${client.id}`}
                  className="mt-auto p-4 border-t flex justify-between items-center transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-alt)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Proyectos</span>
                    <div className="flex items-center gap-2 font-black" style={{ color: 'var(--text-primary)' }}>
                      <Briefcase className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                      {client._count.projects}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }}>
                    Detalles <ChevronRight className="w-3 h-3" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-6 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-alt)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                  </h2>
                  <p className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>Perfil Corporativo</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-base)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              {error && (
                <div className="p-4 rounded-xl flex items-start gap-3 text-sm border" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Razón Social / Empresa *
                  </label>
                  <input type="text" required value={form.name} onChange={setField('name')} placeholder="Ej. Constructora Nova S.A."
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>

                {[
                  { key: 'contact' as const, label: 'Nombre del Contacto', icon: <Users className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />, placeholder: 'Ej. Ing. Carlos Ruiz' },
                  { key: 'rfc' as const, label: 'RFC / ID Fiscal', icon: <Receipt className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />, placeholder: 'Ej. CON123456ABC', upper: true },
                  { key: 'phone' as const, label: 'Teléfono', icon: <Phone className="w-3.5 h-3.5" style={{ color: '#10b981' }} />, placeholder: '+52 55 1234 5678', type: 'tel' },
                  { key: 'email' as const, label: 'Correo Electrónico', icon: <Mail className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />, placeholder: 'contacto@empresa.com', type: 'email' },
                ].map(({ key, label, icon, placeholder, upper, type }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      {icon} {label}
                    </label>
                    <input
                      type={type || 'text'}
                      value={form[key]}
                      onChange={setField(key)}
                      placeholder={placeholder}
                      style={{ ...inputStyle, textTransform: upper ? 'uppercase' : 'none' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                  </div>
                ))}

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /> Dirección / Planta
                  </label>
                  <input type="text" value={form.address} onChange={setField('address')} placeholder="Av. Industrial 42, Monterrey, N.L."
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-6 border-t mt-8" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-alt)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 py-3 text-white rounded-xl text-sm font-black transition-all disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}
                  onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                >
                  {isSubmitting ? 'Guardando...' : editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
