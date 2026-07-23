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
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Panel de Administración</h1>
        <p className="mt-2 text-lg" style={{ color: 'var(--text-muted)' }}>Control de acceso y gestión de roles de usuario (RBAC).</p>
      </header>

      <main>
        <UsersTable initialUsers={users} />
      </main>
    </div>
  )
}
