import { getProducts, getCategories } from '@/app/actions/almacen'
import { getProjects } from '@/app/actions/projects'
import AlmacenClient from '@/components/almacen/AlmacenClient'

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }

export default async function AlmacenPage(props: Props) {
  const params = await props.searchParams;
  const category = typeof params.category === 'string' ? params.category : 'Todas';
  
  const products = await getProducts(category);
  const categories = await getCategories();
  const allProjects = await getProjects();
  const activeProjects = allProjects.filter(p => p.status !== 'CERRADO');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Control Operativo - Almacén</h1>
            <p className="text-slate-500 mt-2 text-lg">Gestión dinámica de inventario y materiales</p>
          </div>
        </header>

        <main>
          <AlmacenClient 
            products={products} 
            categories={categories} 
            currentCategory={category} 
            projects={activeProjects}
          />
        </main>
      </div>
    </div>
  )
}
