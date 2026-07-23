import { getProjects } from '@/app/actions/projects';
import VisorClient from '@/components/visor/VisorClient';

export default async function VisorPage() {
  const initialProjects = await getProjects();

  return <VisorClient initialProjects={initialProjects} />;
}
