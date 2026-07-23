import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ReportsClient from '@/components/almacen/ReportsClient';
import { getInventoryStats, getMovementReport, getDepartmentStats, getReorderingMetrics } from '@/app/actions/reports';

export const metadata = {
  title: 'Reportes | Almacén',
  description: 'Dashboard de análisis e inventario',
};

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !['ADMIN', 'GERENTE', 'TECNICO'].includes(dbUser.role)) {
    redirect('/almacen');
  }

  // Fetch all data in parallel
  const [statsRes, movementRes, deptRes, metricsRes] = await Promise.all([
    getInventoryStats(),
    getMovementReport({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() }),
    getDepartmentStats(),
    getReorderingMetrics()
  ]);

  return (
    <div className="w-full">
      <header className="border-b border-[var(--border)] pb-6 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Reportes de Almacén
        </h1>
        <p className="mt-2 text-lg" style={{ color: 'var(--text-muted)' }}>
          Análisis y estadísticas de inventario
        </p>
      </header>

      <ReportsClient
        stats={statsRes.success ? statsRes.stats : {}}
        movement={movementRes.success ? movementRes.report : {}}
        departments={deptRes.success ? deptRes.stats : {}}
        metrics={metricsRes.success ? metricsRes.metrics : {}}
        userRole={dbUser.role}
      />
    </div>
  );
}
