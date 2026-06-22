import { getProjects, getClients } from '@/app/actions/projects'
import KanbanBoard from '@/components/proyectos/KanbanBoard'
import { getCurrentUserRole } from '@/lib/auth'

export default async function ProyectosPage() {
  const projects = await getProjects()
  const clients = await getClients()
  const role = await getCurrentUserRole()

  return (
    <div className="w-full space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestión de Proyectos</h1>
          <p className="mt-2 text-lg" style={{ color: 'var(--text-muted)' }}>Tablero Kanban y CRM de Clientes</p>
        </div>
      </header>

      <main>
        <KanbanBoard projects={projects} clients={clients} role={role || 'TECNICO'} />
      </main>
    </div>
  )
}
