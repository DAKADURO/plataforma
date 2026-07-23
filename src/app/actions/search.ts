'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUserRole } from '@/lib/auth';

// [SEC-FIX #7] Alinear con el resto de las Server Actions: PENDIENTE no debe
// poder leer datos, aunque técnicamente ya tenga un rol asignado en la BD.
const ACTIVE_ROLES = ['ADMIN', 'GERENTE', 'TECNICO'];

export type SearchResult = {
  id: string;
  type: 'CLIENTE' | 'PROYECTO' | 'PRODUCTO' | 'MAQUINA';
  title: string;
  subtitle: string;
  url: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const role = await getCurrentUserRole();
  if (!role || !ACTIVE_ROLES.includes(role)) return []; // Solo roles activos

  if (!query || query.trim().length < 2) return [];

  const safeQuery = query.trim();
  const results: SearchResult[] = [];

  try {
    // 1. Search Clients
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: safeQuery, mode: 'insensitive' } },
          { rfc: { contains: safeQuery, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    const cResults = clients.map((c: { id: string; name: string; rfc: string | null }) => ({
      id: c.id,
      type: 'CLIENTE' as const,
      title: c.name,
      subtitle: c.rfc ? `RFC: ${c.rfc}` : 'Cliente',
      url: `/clientes/${c.id}`
    }));
    results.push(...cResults);

    // 2. Search Projects
    const projects = await prisma.project.findMany({
      where: {
        name: { contains: safeQuery, mode: 'insensitive' }
      },
      include: { client: { select: { name: true } } },
      take: 5
    });

    const pResults = projects.map((p: { id: string; name: string; client: { name: string } }) => ({
      id: p.id,
      type: 'PROYECTO' as const,
      title: p.name,
      subtitle: `Proyecto - Cliente: ${p.client.name}`,
      url: `/proyectos/${p.id}`
    }));
    results.push(...pResults);

    // 3. Search Products (Almacén)
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: safeQuery, mode: 'insensitive' } },
          { sku: { contains: safeQuery, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    const prodResults = products.map((p: { id: string; name: string; sku: string; category: string }) => ({
      id: p.id,
      type: 'PRODUCTO' as const,
      title: p.name,
      subtitle: `SKU: ${p.sku} | ${p.category}`,
      url: `/almacen`
    }));
    results.push(...prodResults);

    // 4. Search Machines
    const machines = await prisma.machine.findMany({
      where: {
        OR: [
          { name: { contains: safeQuery, mode: 'insensitive' } },
          { serialNumber: { contains: safeQuery, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    const mResults = machines.map((m: { id: string; name: string; serialNumber: string; status: string }) => ({
      id: m.id,
      type: 'MAQUINA' as const,
      title: m.name,
      subtitle: `SN: ${m.serialNumber} | Estatus: ${m.status}`,
      url: `/maquinas`
    }));
    results.push(...mResults);

    return results;
  } catch (error) {
    console.error('Error in globalSearch:', error);
    return [];
  }
}
