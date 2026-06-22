import { getProjects, getClients } from '@/app/actions/projects'
import KanbanBoard from '@/components/proyectos/KanbanBoard'

export default async function ProyectosPage() {
  const projects = await getProjects()
  const clients = await getClients()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestión de Proyectos</h1>
            <p className="text-slate-500 mt-2 text-lg">Tablero Kanban y CRM de Clientes</p>
          </div>
        </header>

        <main>
          <KanbanBoard projects={projects} clients={clients} />
        </main>
      </div>
    </div>
  )
}
