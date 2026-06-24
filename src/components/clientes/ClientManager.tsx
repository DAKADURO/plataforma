'use client'

import { useState } from 'react'
import {
  Plus, Building2, Briefcase, Trash2, Edit2, AlertCircle,
  Search, Mail, Phone, Receipt, MapPin, Users, X
} from 'lucide-react'
import { createClient, updateClient, deleteClient } from '@/app/actions/clients'

type ClientData = {
  id: string
  name: string
  contact: string | null
  email: string | null
  phone: string | null
  rfc: string | null
  address: string | null
  _count: { projects: number }
}

type FormState = {
  name: string
  contact: string
  email: string
  phone: string
  rfc: string
  address: string
}

const emptyForm: FormState = { name: '', contact: '', email: '', phone: '', rfc: '', address: '' }

export default function ClientManager({ initialClients, userRole }: { initialClients: ClientData[], userRole: string }) {
  const [clients, setClients] = useState<ClientData[]>(initialClients)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientData | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canEdit = userRole === 'ADMIN' || userRole === 'GERENTE'

  const filtered = clients.filter(c => {
    const term = search.toLowerCase()
    return c.name.toLowerCase().includes(term) || (c.contact || '').toLowerCase().includes(term)
  })

  const openNew = () => {
    setEditingClient(null)
    setForm(emptyForm)
    setError('')
    setIsModalOpen(true)
  }

  const openEdit = (client: ClientData) => {
    setEditingClient(client)
    setForm({
      name: client.name,
      contact: client.contact || '',
      email: client.email || '',
      phone: client.phone || '',
      rfc: client.rfc || '',
      address: client.address || '',
    })
    setError('')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const payload = {
      name: form.name,
      contact: form.contact || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      rfc: form.rfc || undefined,
      address: form.address || undefined,
    }

    if (editingClient) {
      const res = await updateClient(editingClient.id, payload)
      if (res.success) {
        setClients(prev => prev.map(c => c.id === editingClient.id
          ? { ...c, ...payload, email: form.email || null, phone: form.phone || null, rfc: form.rfc || null, address: form.address || null }
          : c
        ))
        setIsModalOpen(false)
      } else {
        setError(res.error || 'Error al actualizar')
      }
    } else {
      const res = await createClient(payload)
      if (res.success) {
        window.location.reload()
      } else {
        setError(res.error || 'Error al crear')
      }
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Eliminar al cliente "${name}"? Esto eliminará también todos sus proyectos.`)) {
      const res = await deleteClient(id)
      if (res.success) {
        setClients(prev => prev.filter(c => c.id !== id))
      } else {
        alert(res.error || 'Error al eliminar')
      }
    }
  }

  const setField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Directorio de Clientes</h1>
          <p className="text-sm text-slate-400 mt-1">Gestiona la información de tus clientes B2B y visualiza sus proyectos.</p>
        </div>
        {canEdit && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500
              text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por empresa o contacto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#151515] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm
            text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/40 outline-none"
        />
      </div>

      {/* Client cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-white/10">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-500 font-medium">No se encontraron clientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <div
              key={client.id}
              className="bg-[#151515] border border-white/10 rounded-2xl p-5 flex flex-col gap-4
                relative group hover:border-white/20 transition-colors"
            >
              {/* Edit / Delete */}
              {canEdit && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => openEdit(client)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id, client.name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Company name */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0 pr-16">
                  <h3 className="font-semibold text-white leading-tight truncate">{client.name}</h3>
                  {client.rfc && (
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{client.rfc}</span>
                  )}
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-2 text-sm">
                {client.contact && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                    <span className="truncate">{client.contact}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-600 mt-0.5" />
                    <span className="text-xs leading-snug">{client.address}</span>
                  </div>
                )}
              </div>

              {/* Footer: projects + quick actions */}
              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Briefcase className="w-3.5 h-3.5" />
                  {client._count.projects} {client._count.projects === 1 ? 'Proyecto' : 'Proyectos'}
                </div>
                <div className="flex gap-1">
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      title={`Enviar correo a ${client.email}`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      title={`Llamar a ${client.phone}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#151515] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-xl flex items-start gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name (full width) */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={setField('name')}
                  placeholder="Ej. Constructora X S.A. de C.V."
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                    placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 outline-none"
                />
              </div>

              {/* Contact + RFC (2-col) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Contacto Principal
                  </label>
                  <input
                    type="text"
                    value={form.contact}
                    onChange={setField('contact')}
                    placeholder="Ej. Ing. Juan Pérez"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                      placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" /> RFC / ID Fiscal
                  </label>
                  <input
                    type="text"
                    value={form.rfc}
                    onChange={setField('rfc')}
                    placeholder="Ej. CON123456ABC"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                      placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 outline-none uppercase"
                  />
                </div>
              </div>

              {/* Phone + Email (2-col) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Teléfono
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="Ej. +52 55 1234 5678"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                      placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={setField('email')}
                    placeholder="Ej. contacto@empresa.com"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                      placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 outline-none"
                  />
                </div>
              </div>

              {/* Address (full width) */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Dirección / Planta
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={setField('address')}
                  placeholder="Ej. Av. Industrial 42, Monterrey, N.L."
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                    placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold
                    transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingClient ? 'Actualizar Cliente' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
