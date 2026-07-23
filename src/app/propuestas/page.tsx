import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProposalManager from '@/components/propuestas/ProposalManager';

export const metadata = {
  title: 'Propuestas | Memrit Sears',
  description: 'Gestión de propuestas comerciales antes de convertirlas en proyectos',
};

export default async function PropuestasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  const userRole = dbUser?.role || 'TECNICO';

  const [proposals, clients] = await Promise.all([
    prisma.proposal.findMany({
      include: {
        client: { select: { id: true, name: true } },
        photos: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        materials: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="w-full">
      <header className="border-b border-[var(--border)] pb-6 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Propuestas
        </h1>
        <p className="mt-2 text-lg" style={{ color: 'var(--text-muted)' }}>
          Gestión de propuestas comerciales antes de convertirlas en proyectos.
        </p>
      </header>
      <ProposalManager initialProposals={proposals} clients={clients} userRole={userRole} />
    </div>
  );
}
