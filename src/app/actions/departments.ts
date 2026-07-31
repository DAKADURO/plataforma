'use server';

import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ADMIN_ROLES = ['ADMIN', 'GERENTE'];

// Validación de icon permitidos
const ALLOWED_ICONS = [
  'Folder', 'FolderOpen', 'Box', 'Warehouse', 'Package', 'Tag',
  'Wind', 'Zap', 'Droplets', 'HardHat', 'Monitor', 'Briefcase'
];

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50, 'Máximo 50 caracteres'),
  icon: z.enum(ALLOWED_ICONS as [string, ...string[]], {
    errorMap: () => ({ message: `Icon debe ser uno de: ${ALLOWED_ICONS.join(', ')}` })
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hexadecimal válido (ej: #3b82f6)'),
  parentId: z.string().uuid().optional().nullable(),
});

const updateDepartmentSchema = createDepartmentSchema.extend({
  id: z.string().uuid(),
}).partial().extend({
  id: z.string().uuid(),
});

export async function getDepartments() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        children: true,
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    });
    return { success: true, departments };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function validateDepthConstraint(parentId?: string | null): Promise<boolean> {
  if (!parentId) return true;

  // Si se proporciona parentId, verificar que el parent no tenga su propio parent
  // (máximo 1 nivel de profundidad: Department → SubDepartment)
  const parent = await prisma.department.findUnique({
    where: { id: parentId },
    select: { parentId: true }
  });

  if (!parent) return false; // Parent no existe
  if (parent.parentId) return false; // Parent ya es un subdepartamento

  return true;
}

export async function createDepartment(data: { name: string, icon: string, color: string, parentId?: string }) {
  try {
    await requireRole(ADMIN_ROLES);

    // Validar input
    const validation = createDepartmentSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return { success: false, error: Object.entries(errors).map(([k, v]) => `${k}: ${v?.[0]}`).join(', ') };
    }

    // Validar restricción de profundidad
    if (data.parentId) {
      const isValid = await validateDepthConstraint(data.parentId);
      if (!isValid) {
        return { success: false, error: 'Los subdepartamentos no pueden tener más niveles (máximo: Department → SubDepartment)' };
      }
    }

    const department = await prisma.department.create({
      data: {
        name: validation.data.name,
        icon: validation.data.icon,
        color: validation.data.color,
        parentId: validation.data.parentId || null
      },
      include: { _count: { select: { products: true } } }
    });

    revalidatePath('/almacen');
    revalidatePath('/almacen/departamentos');
    return { success: true, department };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe un departamento con ese nombre.' };
    }
    return { success: false, error: error.message };
  }
}

export async function updateDepartment(id: string, data: { name?: string, icon?: string, color?: string, parentId?: string }) {
  try {
    await requireRole(ADMIN_ROLES);

    // Validar input (parcial)
    const validation = updateDepartmentSchema.safeParse({ id, ...data });
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return { success: false, error: Object.entries(errors).map(([k, v]) => `${k}: ${v?.[0]}`).join(', ') };
    }

    // Validar restricción de profundidad si se actualiza parentId
    if (validation.data.parentId) {
      const isValid = await validateDepthConstraint(validation.data.parentId);
      if (!isValid) {
        return { success: false, error: 'Los subdepartamentos no pueden tener más niveles (máximo: Department → SubDepartment)' };
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: validation.data.name,
        icon: validation.data.icon,
        color: validation.data.color,
        parentId: validation.data.parentId !== undefined ? validation.data.parentId : undefined
      },
      include: { _count: { select: { products: true } } }
    });

    revalidatePath('/almacen');
    revalidatePath('/almacen/departamentos');
    return { success: true, department };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe un departamento con ese nombre.' };
    }
    return { success: false, error: error.message };
  }
}

export async function deleteDepartment(id: string) {
  try {
    await requireRole(ADMIN_ROLES);

    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        children: true,
        _count: { select: { products: true } }
      }
    });

    if (!dept) {
      return { success: false, error: 'Departamento no encontrado.' };
    }

    // Verificar si tiene subdepartamentos
    if (dept.children.length > 0) {
      return { success: false, error: 'No se puede eliminar un departamento que tiene subdepartamentos.' };
    }

    // Verificar si tiene productos asociados
    if (dept._count.products > 0) {
      return {
        success: false,
        error: `No se puede eliminar: hay ${dept._count.products} producto(s) asignado(s) a este departamento.`
      };
    }

    await prisma.department.delete({ where: { id } });
    revalidatePath('/almacen');
    revalidatePath('/almacen/departamentos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Inicializa los departamentos base si la tabla está vacía
export async function seedInitialDepartments() {
  try {
    const count = await prisma.department.count();
    if (count > 0) return { success: true, message: 'Ya existen departamentos.' };

    const initial = [
      { name: 'General',   icon: 'FolderOpen', color: '#3b82f6' },
      { name: 'HVAC',      icon: 'Wind',       color: '#06b6d4' },
      { name: 'Eléctrico', icon: 'Zap',        color: '#f59e0b' },
      { name: 'Plomería',  icon: 'Droplets',   color: '#3b82f6' },
      { name: 'Civil',     icon: 'HardHat',    color: '#10b981' },
      { name: 'Sistemas',  icon: 'Monitor',    color: '#a855f7' },
    ];

    await prisma.department.createMany({ data: initial });
    return { success: true, message: 'Departamentos inicializados.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
