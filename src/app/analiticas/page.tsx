/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { getProjects } from '@/app/actions/projects';
import { getProducts } from '@/app/actions/almacen';
import { getClients } from '@/app/actions/projects';
import { getAccountsReceivable } from '@/app/actions/payments';
import DashboardCharts from '@/components/analiticas/DashboardCharts';
import AccountsReceivablePanel from '@/components/analiticas/AccountsReceivablePanel';
import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function AnaliticasPage() {
  // Solo Administradores y Gerentes pueden ver las analíticas ejecutivas
  const userRole = await requireRole(['ADMIN', 'GERENTE']).catch(() => null);
  
  if (!userRole) {
    redirect('/almacen');
  }

  // Fetching live data since analytics should be fresh, and unstable_cache 
  // conflicts with the new role-based security (cookies cannot be read inside unstable_cache)
  const [projects, products, clients, receivable] = await Promise.all([
    getProjects(),
    getProducts(),
    getClients(),
    getAccountsReceivable(),
  ]);

  // Enrich projects with their document count
  const projectsWithDocs = await prisma.project.findMany({
    select: {
      id: true,
      documents: { select: { id: true } }
    }
  });
  
  const docCountMap = Object.fromEntries(projectsWithDocs.map((p: any) => [p.id, p.documents]));
  const activeProjects = projects.filter((p: { status: string }) => p.status !== 'CERRADO');
  const delayedProjects = activeProjects.filter((p: { status: string }) => p.status === 'ATORADO' || p.status === 'RETRASADO');
  const enrichedProjects = projects.map((p: any) => ({
    ...p,
    documents: docCountMap[p.id] ?? [],
  }));

  return (
    <div className="space-y-6">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Analíticas Ejecutivas</h1>
        <p className="mt-2 text-lg" style={{ color: 'var(--text-muted)' }}>Visión global del rendimiento y estado de la empresa.</p>
      </header>

      <DashboardCharts projects={enrichedProjects} products={products} clientCount={clients.length} />

      <AccountsReceivablePanel summary={receivable.success ? receivable.summary : null} />
    </div>
  );
}
