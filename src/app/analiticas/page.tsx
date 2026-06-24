import { getProjects } from '@/app/actions/projects';
import { getProducts } from '@/app/actions/almacen';
import { getClients } from '@/app/actions/projects';
import DashboardCharts from '@/components/analiticas/DashboardCharts';
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
  const [projects, products, clients] = await Promise.all([
    getProjects(),
    getProducts(),
    getClients(),
  ]);

  // Enrich projects with their document count
  const projectsWithDocs = await prisma.project.findMany({
    select: {
      id: true,
      documents: { select: { id: true } }
    }
  });
  
  const docCountMap = Object.fromEntries(projectsWithDocs.map(p => [p.id, p.documents]));
  const enrichedProjects = projects.map(p => ({
    ...p,
    documents: docCountMap[p.id] ?? [],
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Analíticas Ejecutivas</h1>
        <p className="text-slate-500 dark:text-slate-400">Visión global del rendimiento y estado de la empresa.</p>
      </header>

      <DashboardCharts projects={enrichedProjects} products={products} clientCount={clients.length} />
    </div>
  );
}
