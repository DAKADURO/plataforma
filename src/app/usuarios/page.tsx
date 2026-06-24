import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUsers } from '@/app/actions/users'
import UsersTable from '@/components/usuarios/UsersTable'

export default async function UsuariosPage() {
  // Sólo ADMIN puede ver esta página
  const role = await requireRole(['ADMIN']).catch(() => null)
  
  if (!role) {
    redirect('/proyectos')
  }

  const users = await getUsers()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Panel de Administración</h1>
        <p className="text-slate-500 dark:text-slate-400">Control de acceso y gestión de roles de usuario (RBAC).</p>
      </header>

      <main>
        <UsersTable initialUsers={users} />
      </main>
    </div>
  )
}
