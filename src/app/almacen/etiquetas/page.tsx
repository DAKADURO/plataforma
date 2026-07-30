import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import QRPrintManager from '@/components/almacen/QRPrintManager';

export default async function EtiquetasPage() {
  await requireRole(['ADMIN', 'GERENTE', 'TECNICO']);

  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      department: true
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="w-full">
      <QRPrintManager products={products} />
    </div>
  );
}
