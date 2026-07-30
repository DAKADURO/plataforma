/* eslint-disable @typescript-eslint/no-unused-vars */
import { getProducts, getCategories } from '@/app/actions/almacen'
import { getProjects } from '@/app/actions/projects'
import { getDepartments } from '@/app/actions/departments'
import AlmacenClient from '@/components/almacen/AlmacenClient'
import KeyboardShortcuts from '@/components/almacen/KeyboardShortcuts'
import { getCurrentUserRole } from '@/lib/auth'

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }

export default async function AlmacenPage(props: Props) {
  const params = await props.searchParams;
  
  const category = typeof params.category === 'string' ? params.category : 'Todas';
  const department = typeof params.department === 'string' ? params.department : undefined;

  // Fetch departments first so we can include sub-departments in the product filter
  const [allCategories, allProjects, role, deptsRes] = await Promise.all([
    getCategories(),
    getProjects(),
    getCurrentUserRole(),
    getDepartments(),
  ]);

  // Build department filter: include selected department + all its direct children
  let departmentFilter: string[] | undefined = undefined;
  if (department) {
    const allDepts: any[] = deptsRes.departments || [];
    const parent = allDepts.find((d: any) => d.name === department);
    const children = allDepts.filter((d: any) => d.parentId === parent?.id);
    departmentFilter = [department, ...children.map((d: any) => d.name)];
  }

  const products = await getProducts(
    category !== 'Todas' ? category : undefined,
    departmentFilter,
  );

  const activeProjects = allProjects.filter((p: { status: string }) => p.status !== 'CERRADO');

  return (
    <div className="w-full space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Control Operativo - Almacén</h1>
          <p className="mt-2 text-lg" style={{ color: 'var(--text-muted)' }}>Gestión dinámica de inventario y materiales</p>
        </div>
      </header>

      <main>
        <AlmacenClient
          products={products}
          categories={allCategories}
          currentCategory={category}
          currentDepartment={department}
          projects={activeProjects}
          role={role || 'TECNICO'}
          departmentsDB={deptsRes.departments || []}
        />
      </main>

      <KeyboardShortcuts />
    </div>
  )
}
