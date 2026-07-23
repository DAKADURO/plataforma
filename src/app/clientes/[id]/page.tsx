import { getClientById } from '@/app/actions/clients'
import { notFound } from 'next/navigation'
import ClientDetailClient from '@/components/clientes/ClientDetailClient'
import { getCurrentUserRole } from '@/lib/auth'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const client = await getClientById(resolvedParams.id);
  const role = await getCurrentUserRole();

  if (!client) {
    notFound();
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 px-4 md:px-6 py-6">
      <ClientDetailClient client={client} role={role || 'TECNICO'} />
    </div>
  )
}
