import { getMachines } from '@/app/actions/machines'
import { getProducts } from '@/app/actions/almacen'
import { getCurrentUserRole } from '@/lib/auth'
import MachinesClient from '@/components/maquinas/MachinesClient'

export default async function MachinesPage() {
  const machines = await getMachines();
  const products = await getProducts('Todas', 'Todos'); // Fetch all products for the BOM selector
  const role = await getCurrentUserRole();

  return (
    <div className="w-full space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestión de Máquinas</h1>
          <p className="mt-2 text-lg" style={{ color: 'var(--text-muted)' }}>Control de equipos, mantenimientos y materiales</p>
        </div>
      </header>

      <main>
        <MachinesClient 
          machines={machines}
          products={products}
          role={role || 'TECNICO'}
        />
      </main>
    </div>
  )
}
