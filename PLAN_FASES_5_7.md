# Plan para Gemini/Antigravity: Fases 5 y 7 — menait-sears

> Este documento es autocontenido: no asume que quien lo ejecute tiene memoria de conversaciones previas. Antes de programar, lee los archivos mencionados para confirmar que el estado actual coincide con lo aquí descrito (el código puede haber cambiado desde que se escribió esto).

## Contexto del proyecto

- App: Next.js (App Router) + Prisma + PostgreSQL (Supabase) + Supabase Auth (SSR).
- Roles: `ADMIN`, `GERENTE`, `TECNICO`, `PENDIENTE` (control de acceso vía `requireRole()` en `src/lib/auth.ts`).
- Ya construidas: Fase 1 (horas/costo de mano de obra), Fase 2 (costo de máquinas), Fase 3 (facturación/cobros), Fase 4 (BOM por tarea con consumo automático de almacén), Fase 6 (margen bruto + alertas de cobro). **Solo faltan Fase 5 y Fase 7.**
- Flujo de verificación esperado después de cambios de schema: `npx prisma db push` + `npx prisma generate` → `npx tsc --noEmit` → `npx vitest run` → `npm run lint` (no debe subir el conteo de errores/warnings preexistente) → prueba manual en navegador con datos reales → limpiar datos de prueba → commit.
- Estilo de commits: mensajes técnicos bilingües en español, descriptivos.

## Estado actual relevante del schema (`prisma/schema.prisma`)

`ProjectTask` (líneas ~131-145) **no tiene** campo de dependencias todavía:
```prisma
model ProjectTask {
  id                  String            @id @default(uuid())
  projectDepartmentId String
  department          ProjectDepartment @relation(fields: [projectDepartmentId], references: [id], onDelete: Cascade)
  name                String
  startDate           DateTime?
  endDate             DateTime?
  progress            Int               @default(0)
  status              String            @default("PENDIENTE") // PENDIENTE, EN_PROGRESO, COMPLETADA
  createdAt           DateTime          @default(now())
  materials           TaskMaterial[]

  @@index([projectDepartmentId])
  @@index([status])
}
```

`Project` (líneas ~49-70) tiene `status` (NORMAL/RIESGO/ATORADO) y un solo campo `blockReason` que se sobrescribe cada vez (sin historial):
```prisma
model Project {
  id          String        @id @default(uuid())
  name        String
  clientId    String
  status      String        @default("NORMAL")
  blockReason String?
  ...
}
```

`AuditLog` (líneas ~24-32) existe pero está **100% sin usar** en el código, y le falta `entityId` para poder filtrar por proyecto:
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String
  entity    String
  details   String?
  createdAt DateTime @default(now())
}
```

El progreso de tareas se recalcula automáticamente en servidor: `recalcProjectProgress()` en `src/app/actions/tasks.ts` (promedia tareas → departamento → proyecto, se llama tras create/update/delete de tarea).

La vista Gantt/Cronograma está hecha a mano con posicionamiento por porcentaje (`leftOffset`/`width`) dentro de `src/components/proyectos/ProjectDetailClient.tsx` — busca el bloque "Cronograma" (contiene un `border-l-4` por tarea, coloreado según status). No usa ninguna librería de Gantt.

`Notifications.tsx` (`src/components/layout/Notifications.tsx`) es el único patrón de "feed"/lista cronológica que ya existe en el proyecto — úsalo como referencia visual para el feed de Actividad de Fase 7.

---

## Fase 5: Gantt con dependencias (Finish-to-Start)

**Alcance:** una tarea depende de **una sola** tarea predecesora (no multi-predecesor). Relación Finish-to-Start: la dependiente no puede avanzar hasta que la predecesora llegue a 100%.

### 1. Modelo de datos
Agregar a `ProjectTask` en `prisma/schema.prisma`:
```prisma
dependsOnTaskId String?
dependsOnTask   ProjectTask?  @relation("TaskDependency", fields: [dependsOnTaskId], references: [id], onDelete: SetNull)
dependentTasks  ProjectTask[] @relation("TaskDependency")
```

### 2. Validación y bloqueo (`src/app/actions/tasks.ts`)
- Al crear/editar una tarea, permitir elegir una predecesora (dropdown con las demás tareas del **mismo proyecto**, no solo del mismo departamento).
- **Prevención de ciclos**: al guardar `dependsOnTaskId`, recorrer la cadena de predecesores; si se vuelve a la tarea propia, rechazar con error claro.
- **Bloqueo real** en `updateTask`: si `progress > 0` y la tarea tiene `dependsOnTaskId` cuya predecesora tiene `progress < 100`, rechazar con:
  `{ success: false, error: 'No se puede iniciar: depende de "<nombre tarea>" que aún no está completada.' }`

### 3. UI (`src/components/proyectos/ProjectDetailClient.tsx`, componente `TaskRow`)
- Selector de predecesora al crear/editar tarea.
- Si la predecesora no está completa: deshabilitar el slider de progreso, ícono de candado con tooltip explicando por qué (mismo patrón `disabled`/`opacity` ya usado para el rol `TECNICO`).

### 4. Vista Gantt con conectores
En el bloque "Cronograma" que ya calcula `leftOffset`/`width` por tarea:
- Para cada tarea con `dependsOnTaskId`, dibujar una línea/flecha SVG conectando el borde derecho de la barra predecesora con el borde izquierdo de la dependiente (overlay `<svg>` absoluto sobre el contenedor, usando las mismas coordenadas porcentuales ya calculadas — no requiere librería nueva).
- Resaltar en rojo (variable CSS `--danger`) tareas cuya `endDate` ya pasó y `progress < 100`, o bloqueadas por predecesora atrasada. Esto es una heurística simplificada de "en riesgo", **no** un algoritmo CPM completo — documentar esa limitación en el commit.

### Archivos a tocar
- `prisma/schema.prisma`
- `src/lib/validations/index.ts` (agregar `dependsOnTaskId` opcional a schemas de tarea)
- `src/app/actions/tasks.ts` (validación de ciclos + bloqueo de progreso)
- `src/components/proyectos/ProjectDetailClient.tsx` (selector, candado, conectores SVG)

---

## Fase 7: Gestión de Riesgos (bitácora de bloqueos + historial de cambios)

### 1. Bitácora de causas de bloqueo con historial real
Hoy `Project.blockReason` se sobrescribe cada vez. Agregar:
```prisma
model ProjectStatusEvent {
  id        String   @id @default(uuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  status    String   // NORMAL, RIESGO, ATORADO
  category  String?  // "Falta de suministro", "Fallo de diseño", "Cliente retrasó anticipo", "Otro"
  reason    String?  // texto libre adicional
  userId    String?
  createdAt DateTime @default(now())

  @@index([projectId])
}
```
- En `updateProjectStatus` (`src/app/actions/projects.ts`): al cambiar a `RIESGO`/`ATORADO`, exigir una `category` de lista corta predefinida (+ texto libre opcional) y guardar un `ProjectStatusEvent`. Mantener `Project.blockReason` como está (compatibilidad con lo ya construido).
- En Analíticas (`src/app/analiticas/page.tsx`): conteo de causas más frecuentes de bloqueo/riesgo de toda la empresa (`groupBy` sobre `ProjectStatusEvent.category`).

### 2. Activar `AuditLog` (historial de cambios)
- Agregar `entityId String?` al modelo `AuditLog` existente.
- Crear `src/lib/audit.ts` con helper `logAudit({ userId, action, entity, entityId, details })`.
- Alcance acotado — instrumentar solo acciones de alto valor: cambios de estado de proyecto, edición de presupuesto/monto contratado, subida de documentos técnicos. (Se puede extender después.)
- Nueva pestaña/sección "Actividad" en `ProjectDetailClient.tsx`: lista `AuditLog` filtrado por `entity: 'Project', entityId: project.id`, orden cronológico, modelada visualmente sobre el feed de `Notifications.tsx`.

### Archivos a tocar
- `prisma/schema.prisma` (`ProjectStatusEvent` nuevo, `AuditLog.entityId` nuevo)
- `src/lib/audit.ts` (nuevo)
- `src/app/actions/projects.ts` (`updateProjectStatus` con categoría + evento; llamadas a `logAudit` en acciones acotadas)
- `src/app/actions/documents.ts` (llamada a `logAudit` en subida)
- `src/components/proyectos/ProjectDetailClient.tsx` (modal de categoría al marcar Riesgo/Atorado, pestaña "Actividad")
- `src/app/analiticas/page.tsx` (conteo de causas de bloqueo)

---

## Orden recomendado
1. **Fase 7** primero — aislada del resto, bajo riesgo de romper algo existente.
2. **Fase 5** al final — la más compleja de UI (SVG, prevención de ciclos, bloqueo de progreso).

## Notas de seguridad/patrones a respetar
- Todo dato financiero/sensible debe seguir ocultándose tanto en UI como **en el payload del server component** para el rol `TECNICO` (ver `src/app/proyectos/[id]/page.tsx`, sanitización ya existente) — Fase 7 no agrega datos financieros nuevos, pero si se te ocurre exponer algo del feed de Actividad a todos los roles, revisa si aplica la misma restricción.
- Evitar el patrón `useEffect` + `setState` para sincronizar estado local con props que cambian por `router.refresh()` — dispara el lint rule `react-hooks/set-state-in-effect` de este proyecto. Usar en su lugar: derivar por id en render, o actualizar estado local de forma optimista en el punto de la acción del usuario.
- Fechas: usar `z.coerce.date()` en validaciones y `toLocaleDateString('es-MX', { timeZone: 'UTC' })` / `Date.UTC(...)` para mostrar y comparar fechas — evita bugs de día-off-by-one por zona horaria.
