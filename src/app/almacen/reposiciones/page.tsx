import { getRestockOrders } from '@/app/actions/restock';
import { getCurrentUserRole } from '@/lib/auth';
import RestockManager from '@/components/almacen/RestockManager';

export default async function ReposicionesPage() {
  const [orders, role] = await Promise.all([
    getRestockOrders(),
    getCurrentUserRole()
  ]);

  return (
    <div className="w-full">
      <RestockManager orders={orders as any} role={role || 'TECNICO'} />
    </div>
  );
}
