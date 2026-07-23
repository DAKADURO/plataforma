/* eslint-disable @typescript-eslint/no-unused-vars */
import { getProducts, getCategories } from '@/app/actions/almacen'
import { getProjects } from '@/app/actions/projects'
import AlmacenClient from '@/components/almacen/AlmacenClient'
import { getCurrentUserRole } from '@/lib/auth'

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }

export default async function AlmacenPage(props: Props) {
  const params = await props.searchParams;
  
  const category = typeof params.category === 'string' ? params.category : 'Todas';
  const department = typeof params.department === 'string' ? params.department : undefined;
  
  const [products, allCategories, allProjects, role] = await Promise.all([
    getProducts(),
    getCategories(),
    getProjects(),
    getCurrentUserRole()
  ]);
  
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
        />
      </main>
    </div>
  )
}
