import { getProjectById } from '@/app/actions/projects'
import { getProducts } from '@/app/actions/almacen'
import { notFound } from 'next/navigation'
import ProjectDetailClient from '@/components/proyectos/ProjectDetailClient'
import { getCurrentUserRole } from '@/lib/auth'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [project, role, products] = await Promise.all([
    getProjectById(resolvedParams.id),
    getCurrentUserRole(),
    getProducts(undefined, undefined)
  ]);

  if (!project) {
    notFound();
  }

  // El costo por hora, los cobros al cliente y los montos de presupuesto/contrato
  // son confidenciales: nunca deben llegar al navegador de un TECNICO, aunque la UI
  // ya lo oculte (el JSON del server component sí viaja completo). La bitácora de
  // Actividad (Fase 7) puede exponer presupuesto/monto contratado en texto libre,
  // así que esas entradas también se filtran aquí.
  const resolvedRole = role || 'TECNICO'
  const sanitizedProject = resolvedRole === 'TECNICO'
    ? {
        ...project,
        workLogs: project.workLogs.map(w => ({ ...w, hourlyCostSnapshot: 0 })),
        payments: [],
        auditLogs: (project.auditLogs || []).filter(
          a => a.action !== 'UPDATE_BUDGET' && a.action !== 'UPDATE_CONTRACT_AMOUNT'
        ),
      }
    : project

  return (
    <div className="w-full">
      <div className="w-full max-w-[1400px] mx-auto space-y-8 px-4 md:px-6">
        <ProjectDetailClient project={sanitizedProject} role={resolvedRole} products={products} />
      </div>
    </div>
  )
}
