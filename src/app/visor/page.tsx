import { getProjects } from '@/app/actions/projects';
import VisorClient from '@/components/visor/VisorClient';

export default async function VisorPage() {
  const initialProjects = await getProjects();

  return (
    <div className="bg-slate-950 text-slate-50 min-h-screen">
      <VisorClient initialProjects={initialProjects} />
    </div>
  );
}
