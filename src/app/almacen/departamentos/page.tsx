import { getDepartments, seedInitialDepartments } from '@/app/actions/departments';
import { requireRole } from '@/lib/auth';
import DepartmentManager from '@/components/almacen/DepartmentManager';

export default async function DepartamentosPage() {
  await requireRole(['ADMIN', 'GERENTE']);

  let res = await getDepartments();
  
  if (res.success && res.departments?.length === 0) {
    await seedInitialDepartments();
    res = await getDepartments();
  }

  return (
    <div className="w-full">
      <DepartmentManager departments={(res.departments as any) || []} />
    </div>
  );
}
