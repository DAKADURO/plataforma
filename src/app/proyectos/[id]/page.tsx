import { getProjectById } from '@/app/actions/projects'
import { notFound } from 'next/navigation'
import ProjectDetailClient from '@/components/proyectos/ProjectDetailClient'
import { getCurrentUserRole } from '@/lib/auth'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = await getProjectById(resolvedParams.id);
  const role = await getCurrentUserRole();

  if (!project) {
    notFound();
  }

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto space-y-8">
        <ProjectDetailClient project={project} role={role || 'TECNICO'} />
      </div>
    </div>
  )
}
