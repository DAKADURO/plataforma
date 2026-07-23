import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ClientManager from '@/components/clientes/ClientManager'

export const metadata = {
  title: 'Clientes | Menrit Sears',
  description: 'Gestión de clientes y empresas',
}

export default async function ClientesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user role
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! }
  })
  const userRole = dbUser?.role || 'TECNICO'

  // Fetch all clients with project count
  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: { projects: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="w-full">
      <ClientManager initialClients={clients} userRole={userRole} />
    </div>
  )
}
