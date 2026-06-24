# 🚀 Plataforma de Gestión Operativa Integral

Plataforma empresarial de alto rendimiento diseñada para la gestión de proyectos, control documental, inventario industrial, análisis ejecutivo y CRM B2B. Construida con un enfoque en **Diseño Premium (Glassmorphism, Bento Grid)** y una experiencia de usuario extremadamente fluida.

---

## 🌟 Características Principales

### 📊 Centro de Comando Inmersivo (/visor)
- **Modo Kiosco (Pantalla Completa):** Optimizado para Smart TVs y monitores de operación. No hay barra de navegación que distraiga.
- **Bento Grid:** Layout tipo mosaico responsivo y estético.
- **Alertas Visuales (Glow & Pulse):** Indicadores visuales fuertes para estados críticos (Proyectos Atorados en rojo con animación de pulso, Proyectos en Riesgo en ámbar).
- **Glassmorphism:** Diseño de tarjetas semitransparentes sobre un fondo oscuro con gradiente radial.
- **Progreso Dinámico:** Barras de progreso con animaciones de resplandor (shimmer) y conteo de tareas en tiempo real.

### 📋 Tablero Kanban Premium (/proyectos)
- **Estilo Jira / Linear:** Diseño oscuro, enfocado y profesional.
- **Swimlanes Diferenciados:** Columnas con fondos tenues personalizados (Verde, Ámbar, Rojo).
- **Scroll Inteligente:** Altura fija con `overflow-y-auto` que mantiene siempre visible el encabezado de las columnas.
- **Tarjetas Enriquecidas:** Muestran el progreso, número de tareas completadas, y empresa cliente. Cuentan con animaciones de elevación al pasar el ratón (`hover:-translate-y-1`).
- **Buscador Integrado:** Búsqueda en tiempo real por proyecto o nombre de cliente.

### 📂 Gestor Documental Técnico - DMS (/proyectos/[id])
- **Carpetas Dinámicas:** Organización visual de archivos técnicos mediante agrupaciones (Ej. "Planos y Diagramas", "Permisos", "Formatos y Contratos").
- **Control de Versiones:** Historial de revisiones de cada documento técnico con fecha y autor.
- **Almacenamiento Seguro:** Subida de archivos directamente a Supabase Storage con sanitización automática de nombres de archivo (evitando errores por caracteres especiales o espacios).
- **Plan de Trabajo (Tareas):** Gestor de tareas embebido dentro de cada proyecto con asignación de fechas de inicio, fin y actualización de progreso individual.

### 📈 Analíticas Ejecutivas (/analiticas)
- **Dashboard Premium:** Visión global del estado de la empresa diseñada para gerentes y administradores.
- **KPIs Enriquecidos:** Tarjetas "Glassmorphism" con orbes de brillo para métricas clave (Proyectos Activos, Progreso, Alertas de Stock, Clientes Activos, Proyectos en Riesgo, Documentos).
- **Gráficos Recharts Personalizados:**
  - *Gráfico Donut (Anillo):* Distribución de estados semánticos sin bordes blancos y con un contador central total.
  - *Gráfico de Barras:* Progreso de cada proyecto individual con puntas redondeadas y guías visuales (`CartesianGrid`) sutiles.
- **Tooltips Oscuros:** Popups informativos estéticos que mantienen el diseño de la aplicación al interactuar con las gráficas.

### 🏢 Directorio de Clientes y CRM (/clientes)
- **Directorio Profesional:** Modal a doble columna para creación y edición.
- **Campos Completos B2B:** Registro de Teléfono, Email, RFC (Identificación Fiscal) y Dirección Física.
- **Acciones Rápidas:** Enlaces `mailto:` y `tel:` directos en la tabla para comunicación inmediata.

### 📦 Control de Almacén (/almacen)
- **Data Table Industrial:** Vista en formato tabla optimizada para buscar rápidamente y visualizar el stock crítico.
- **Indicadores (Badges):** Etiquetas de colores para identificar instantáneamente si el stock está en un nivel suficiente o crítico.
- **Entradas y Salidas:** Botones de acción directa para gestionar el inventario.

---

## 🛠️ Stack Tecnológico

- **Framework Frontend:** [Next.js 14/15](https://nextjs.org/) (App Router, Server Actions)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS (Dark Mode nativo, Glassmorphism)
- **Íconos:** Lucide React
- **Gráficos:** Recharts
- **Base de Datos:** PostgreSQL (alojada en [Supabase](https://supabase.com/))
- **ORM:** Prisma
- **Autenticación y Storage:** Supabase Auth & Storage

---

## ⚙️ Estructura del Esquema de Datos (Prisma)

El modelo de datos relacional incluye:
- `User`: Gestión de roles (Admin, Gerente, Técnico).
- `Client`: CRM B2B con datos fiscales y de contacto.
- `Project`: Eje central que agrupa Tareas, Documentos e Inventario usado.
- `ProjectTask`: Planificador dinámico estilo Gantt para seguimiento granular.
- `Document` y `DocumentVersion`: DMS con soporte de carpetas.
- `Product` e `InventoryEntry`: Control de catálogo de almacén y movimientos (Kardex).

---

## 🚀 Despliegue

La plataforma está optimizada para ser desplegada en entornos compatibles con Next.js (ej. Vercel, Railway).
Se utiliza el comando de compilación por defecto de Next.js (`next build`).

*Para despliegues locales, recuerda asegurar tus variables de entorno:*
- `DATABASE_URL` y `DIRECT_URL` (Supabase Connection Pooler)
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---
*Plataforma desarrollada para maximizar el control, la estética y la experiencia de usuario ejecutiva.*
