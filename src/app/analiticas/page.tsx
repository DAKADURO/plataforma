import { getProjects } from '@/app/actions/projects';
import { getProducts } from '@/app/actions/almacen';
import DashboardCharts from '@/components/analiticas/DashboardCharts';
import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AnaliticasPage() {
  // Solo Administradores y Gerentes pueden ver las analíticas ejecutivas
  const userRole = await requireRole(['ADMIN', 'GERENTE']).catch(() => null);
  
  if (!userRole) {
    redirect('/almacen');
  }

  const projects = await getProjects();
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Analíticas Ejecutivas</h1>
        <p className="text-slate-500 dark:text-slate-400">Visión global del rendimiento y estado de la empresa.</p>
      </header>

      <DashboardCharts projects={projects} products={products} />
    </div>
  );
}
