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

// Task Material Schema (BOM por tarea)
export const createTaskMaterialSchema = z.object({
  taskId: z.string().uuid("ID de tarea inválido"),
  productId: z.string().uuid("ID de producto inválido"),
  quantity: z.number().int().positive("La cantidad debe ser un entero mayor a cero"),
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
  dailyRate: z.number().min(0, "La tarifa no puede ser negativa").max(1000000).optional(),
});

export const updateMachineDailyRateSchema = z.object({
  machineId: z.string().uuid("ID de máquina inválido"),
  dailyRate: z.number().min(0, "La tarifa no puede ser negativa").max(1000000),
});

// Machine Assignment Schema (asignación de máquina a proyecto)
export const createMachineAssignmentSchema = z.object({
  machineId: z.string().uuid("ID de máquina inválido"),
  projectId: z.string().uuid("ID de proyecto inválido"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(250).optional(),
}).refine(data => !data.endDate || data.endDate >= data.startDate, {
  message: "La fecha de fin no puede ser anterior a la de inicio",
  path: ["endDate"],
});

// Project Payment Schema (facturación y cobros)
export const createProjectPaymentSchema = z.object({
  projectId: z.string().uuid("ID de proyecto inválido"),
  concept: z.string().min(2, "El concepto debe tener al menos 2 caracteres").max(100),
  amount: z.number().positive("El monto debe ser mayor a cero").max(100000000),
  dueDate: z.coerce.date().optional(),
  notes: z.string().max(250).optional(),
});

export const updateProjectContractAmountSchema = z.object({
  projectId: z.string().uuid("ID de proyecto inválido"),
  contractAmount: z.number().min(0, "El monto no puede ser negativo").max(100000000),
});

// Work Log Schema (horas de mano de obra)
export const createWorkLogSchema = z.object({
  projectId: z.string().uuid("ID de proyecto inválido"),
  date: z.coerce.date(),
  hours: z.number().positive("Las horas deben ser mayores a cero").max(24, "Máximo 24 horas por registro"),
  description: z.string().max(250).optional(),
});

// User Hourly Cost Schema
export const updateUserHourlyCostSchema = z.object({
  userId: z.string().uuid("ID de usuario inválido"),
  hourlyCost: z.number().min(0, "El costo por hora no puede ser negativo").max(100000),
});

// User Role Schema
export const updateUserRoleSchema = z.object({
  userId: z.string().uuid("ID de usuario inválido"),
  newRole: z.enum(['ADMIN', 'GERENTE', 'TECNICO', 'PENDIENTE'], {
    message: "Rol inválido",
  }),
});
