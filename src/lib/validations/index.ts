import { z } from 'zod';

// Client Schema
export const createClientSchema = z.object({
  name: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres").max(100),
  contact: z.string().max(100).optional(),
  email: z.string().email("Correo electrónico inválido").optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  rfc: z.string().max(20).optional(),
  address: z.string().max(250).optional(),
});

// Project Schema
export const createProjectSchema = z.object({
  name: z.string().min(3, "El nombre del proyecto debe tener al menos 3 caracteres").max(100),
  clientId: z.string().uuid("ID de cliente inválido"),
});

// Task Schema
export const createProjectTaskSchema = z.object({
  name: z.string().min(2, "La tarea debe tener al menos 2 caracteres").max(150),
  projectId: z.string().uuid(),
});

// Inventory Schema
export const createProductSchema = z.object({
  sku: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  department: z.string().min(2).max(50),
  itemType: z.string().min(2).max(50),
  minStock: z.number().int().min(0).default(5),
});

// Tag Schema
export const createTagSchema = z.object({
  name: z.string().min(2, "El nombre de la etiqueta debe tener al menos 2 caracteres").max(50),
  description: z.string().max(250).optional(),
  color: z.string().max(20).optional(),
});

// Machine Schema
export const createMachineSchema = z.object({
  name: z.string().min(2, "El nombre de la máquina debe tener al menos 2 caracteres").max(100),
  serialNumber: z.string().min(1, "El número de serie es obligatorio").max(100),
  category: z.string().min(2).max(50),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  imageUrl: z.string().max(500).optional(),
  isImported: z.boolean().optional(),
});

// User Role Schema
export const updateUserRoleSchema = z.object({
  userId: z.string().uuid("ID de usuario inválido"),
  newRole: z.enum(['ADMIN', 'GERENTE', 'TECNICO', 'PENDIENTE'], {
    message: "Rol inválido",
  }),
});
