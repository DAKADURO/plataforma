'use server';

import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const ADMIN_ROLES = ['ADMIN', 'GERENTE'];

export async function getDepartments() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        children: true,
      },
      orderBy: { name: 'asc' }
    });
    return { success: true, departments };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDepartment(data: { name: string, icon: string, color: string, parentId?: string }) {
  try {
    await requireRole(ADMIN_ROLES);
    const department = await prisma.department.create({
      data: {
        name: data.name,
        icon: data.icon,
        color: data.color,
        parentId: data.parentId || null
      }
    });
    revalidatePath('/almacen');
    revalidatePath('/almacen/configuracion');
    return { success: true, department };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe un departamento con ese nombre.' };
    }
    return { success: false, error: error.message };
  }
}

export async function updateDepartment(id: string, data: { name: string, icon: string, color: string, parentId?: string }) {
  try {
    await requireRole(ADMIN_ROLES);
    const department = await prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon,
        color: data.color,
        parentId: data.parentId || null
      }
    });
    // Si se actualiza el nombre del departamento, actualizar todos los productos con ese nombre?
    // No lo haremos automáticamente por ahora para no complicar, o sí?
    // Sería mejor hacerlo para que los productos sigan coincidiendo.
    revalidatePath('/almacen');
    revalidatePath('/almacen/configuracion');
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
    // Verificar si tiene subdepartamentos
    const dept = await prisma.department.findUnique({
      where: { id },
      include: { children: true }
    });
    
    if (dept?.children.length) {
      return { success: false, error: 'No se puede eliminar un departamento que tiene subdepartamentos.' };
    }

    await prisma.department.delete({ where: { id } });
    revalidatePath('/almacen');
    revalidatePath('/almacen/configuracion');
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
