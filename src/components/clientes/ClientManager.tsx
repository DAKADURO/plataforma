'use client'

import { useState } from 'react'
import { Plus, Building2, Phone, Briefcase, Trash2, Edit2, AlertCircle } from 'lucide-react'
import { createClient, updateClient, deleteClient } from '@/app/actions/clients'

type ClientData = {
  id: string
  name: string
  contact: string | null
  _count: { projects: number }
}

export default function ClientManager({ initialClients, userRole }: { initialClients: ClientData[], userRole: string }) {
  const [clients, setClients] = useState<ClientData[]>(initialClients)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientData | null>(null)
  
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canEditOrDelete = userRole === 'ADMIN' || userRole === 'GERENTE'

  const openNewModal = () => {
    setEditingClient(null)
    setName('')
    setContact('')
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (client: ClientData) => {
    setEditingClient(client)
    setName(client.name)
    setContact(client.contact || '')
    setError('')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (editingClient) {
      const res = await updateClient(editingClient.id, { name, contact: contact || undefined })
      if (res.success) {
        setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, name, contact: contact || null } : c))
        setIsModalOpen(false)
      } else {
        setError(res.error || 'Error al actualizar')
      }
    } else {
      const res = await createClient({ name, contact: contact || undefined })
      if (res.success) {
        window.location.reload() // Reload to get fresh data from server with ID and _count
      } else {
        setError(res.error || 'Error al crear')
      }
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar al cliente "${name}"? Esto también eliminará todos sus proyectos asociados.`)) {
      const res = await deleteClient(id)
      if (res.success) {
        setClients(prev => prev.filter(c => c.id !== id))
      } else {
        alert(res.error || 'Error al eliminar')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Directorio de Clientes</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Gestiona la información de tus clientes y visualiza sus proyectos.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-alt)' }}>
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay clientes registrados.</p>
          </div>
        ) : (
          clients.map(client => (
            <div key={client.id} className="p-5 rounded-2xl border flex flex-col gap-4 relative group transition-colors"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              
              {canEditOrDelete && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button onClick={() => openEditModal(client)} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-alt)] text-[var(--text-muted)] hover:text-[var(--accent)]">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(client.id, client.name)} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-alt)] text-[var(--text-muted)] hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold pr-16 leading-tight" style={{ color: 'var(--text-primary)' }}>{client.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <Phone className="w-3 h-3" />
                    <span>{client.contact || 'Sin contacto'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{client._count.projects} {client._count.projects === 1 ? 'Proyecto' : 'Proyectos'} activos</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-4">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre de la Empresa / Cliente</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 transition-shadow"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  placeholder="Ej. Constructora X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contacto (Opcional)</label>
                <input
                  type="text"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 transition-shadow"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  placeholder="Ej. Ing. Juan Pérez - 555 1234"
                />
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
