import { getProjects, getClients } from '@/app/actions/projects'
import KanbanBoard from '@/components/proyectos/KanbanBoard'
import { getCurrentUserRole } from '@/lib/auth'

export default async function ProyectosPage() {
  // [SEC-FIX #4] Fail-Closed: si el rol no puede verificarse, se bloquea el acceso
  // En lugar de asignar 'TECNICO' por defecto (Fail-Open), se muestra pantalla de denegado
  let projects = [] as Awaited<ReturnType<typeof getProjects>>
  let clients = [] as Awaited<ReturnType<typeof getClients>>

  const role = await getCurrentUserRole()

  // Solo usuarios con rol activo pueden cargar datos y ver el tablero
  if (!role || !['ADMIN', 'GERENTE', 'TECNICO'].includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-bold tracking-tight">Acceso Restringido</h1>
        <p className="text-center max-w-sm" style={{ color: 'var(--text-muted)' }}>
          Tu cuenta no tiene los permisos necesarios para acceder a esta sección.
          Contacta a un Administrador para solicitar acceso.
        </p>
      </div>
    )
  }

  // Cargar datos solo después de confirmar el rol
  [projects, clients] = await Promise.all([
    getProjects(),
    getClients()
  ]);

  return (
    <div className="w-full space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestión de Proyectos</h1>
          <p className="mt-2 text-lg" style={{ color: 'var(--text-muted)' }}>Tablero Kanban y CRM de Clientes</p>
        </div>
      </header>

      <main>
        <KanbanBoard projects={projects} clients={clients} role={role} />
      </main>
    </div>
  )
}
