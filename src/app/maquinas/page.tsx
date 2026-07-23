import { getMachines } from '@/app/actions/machines'
import { getProducts } from '@/app/actions/almacen'
import { getCurrentUserRole } from '@/lib/auth'
import MachinesClient from '@/components/maquinas/MachinesClient'

export default async function MachinesPage() {
  const [machines, products, role] = await Promise.all([
    getMachines(),
    getProducts('Todas', 'Todos'),
    getCurrentUserRole()
  ]);

  return (
    <div className="w-full space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Control de Recursos y Equipos</h1>
          <p className="mt-2 text-lg" style={{ color: 'var(--text-muted)' }}>Gestión centralizada de vehículos, computadoras, maquinaria y activos físicos</p>
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
