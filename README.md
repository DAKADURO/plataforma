<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield.svg" width="80" alt="Logo">
  <h1 align="center">Memrit Sears - Plataforma Operativa B2B</h1>
  
  <p align="center">
    <strong>Sistema integral de Control Operativo, Gestor Documental (DMS) y Centro de Comando Ejecutivo.</strong>
  </p>

  <p align="center">
    <a href="#-características">Características</a> •
    <a href="#-tecnologías">Tecnologías</a> •
    <a href="#-arquitectura">Arquitectura</a> •
    <a href="#-seguridad-y-roles">Seguridad</a> •
    <a href="#-despliegue">Despliegue</a>
  </p>
</div>

---

## ⚡ Características

La plataforma está construida con una filosofía de diseño **Premium / Enterprise (Bento Grid + Glassmorphism)**, asegurando que la experiencia de usuario sea tanto estéticamente imponente como altamente funcional.

### 🏭 Operativa y Logística
- **Tablero Kanban Inteligente:** Gestión de proyectos B2B estilo *Jira / Linear* con "Swimlanes" interactivos, arrastre suave y diferenciación por estados (Normal, Riesgo, Atorado).
- **Gestor Documental Técnico (DMS):** Organización de activos en "Carpetas Dinámicas" virtuales, con soporte de versionado de planos y documentos técnicos (Almacenado directamente en la nube).
- **Control de Almacén:** Data Table industrial para rastreo de stock en tiempo real, alertas de stock mínimo (Badges semánticos) y movimientos de entrada/salida (Kardex).

### 📈 Ejecutiva y Analítica
- **Analíticas Avanzadas:** Dashboard para gerencia con gráficos de anillo dinámicos y barras de gradiente suavizado que visualizan la salud financiera y operativa de todos los proyectos al instante.
- **Centro de Comando (Kiosko):** Vista inmersiva "Full-Screen" optimizada para Smart TVs en las instalaciones. Interfaz oscura profunda con *glow orbs* para monitorear el progreso y retrasos en piso.
- **Directorio de Clientes CRM:** Gestión relacional con información técnica, correos, RFC y contactos anclados a cada proyecto activo.

---

## 🛠 Tecnologías

Esta arquitectura moderna y serverless asegura baja latencia y alta escalabilidad:

| Capa | Tecnología | Detalles |
| :--- | :--- | :--- |
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js%2014-black?style=flat&logo=next.js) | App Router, Server Actions, React 19 |
| **Styling** | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) | Modo oscuro nativo, Glassmorphism UI |
| **Base de Datos** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white) | Relacional de alto rendimiento |
| **ORM** | ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white) | Tipado estricto extremo a extremo |
| **Autenticación** | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white) | JWT Auth en el Borde (Edge Proxy) |
| **Gráficos** | ![Recharts](https://img.shields.io/badge/Recharts-22b5bf?style=flat) | Renderizado SVG optimizado |

---

## 🛡️ Seguridad y Roles (RBAC)

El acceso a la información confidencial está blindado en múltiples capas.
La interceptación de rutas opera nativamente en el *Edge* vía `proxy.ts`, garantizando velocidad y seguridad.

**Flujo de Aprobación (Zero-Trust):**
1. Un empleado utiliza el módulo de **/registro** para solicitar acceso.
2. Su cuenta se crea de forma segura, pero se inyecta a la base de datos con un rol **PENDIENTE**. El usuario *no puede ver absolutamente nada* del sistema.
3. Un usuario nivel `ADMIN` entra al panel de **Directorio de Usuarios** y aprueba el acceso promoviéndolo al rol correspondiente.

**Jerarquía de Roles:**
- 🔴 **ADMIN:** Acceso irrestricto, capacidad para modificar roles de sistema e infraestructura base.
- 🔵 **GERENTE:** Capacidad de gestión, creación de clientes, apertura de proyectos, acceso a Analíticas y proyecciones.
- 🟢 **TÉCNICO:** Operatividad pura en piso (Completar tareas del Kanban, subir archivos al DMS, ajustar inventario en almacén).

---

## 🏗 Arquitectura de Datos (Resumen de Esquema)

El sistema opera bajo un diagrama de Relación de Entidades estrictamente anclado a un **Proyecto**:

```mermaid
erDiagram
    PROJECT ||--o{ PROJECT_TASK : contains
    PROJECT ||--o{ DOCUMENT : has
    CLIENT ||--o{ PROJECT : requests
    DOCUMENT ||--|{ DOCUMENT_VERSION : tracks
    PRODUCT ||--o{ INVENTORY : records
    PROJECT ||--o{ INVENTORY : uses
```

---

## 🧠 Arquitectura Interna y Flujo (Cómo Funciona)

El sistema opera utilizando un patrón arquitectónico fuertemente acoplado a **Next.js 14/15 App Router** y al paradigma de **Server Actions**. Esto significa que *no existen rutas de API REST tradicionales* (endpoints `/api/...`); toda la mutación de datos ocurre a través de llamadas RPC seguras de extremo a extremo.

### Interacción de los Componentes
1. **Frontend (Componentes Cliente/Servidor):**
   - Los componentes de lectura (`page.tsx`) son **Server Components**. Estos consultan directamente a la base de datos PostgreSQL a través de Prisma antes de enviar HTML al cliente, logrando tiempos de carga iniciales casi instantáneos (Zero JS en carga de lectura).
   - Los formularios y botones interactivos son **Client Components**. Para realizar una acción (Ej. crear un cliente), el cliente invoca una función asíncrona importada directamente desde la carpeta `/actions` (Server Actions).

2. **Capa de Lógica de Negocio (Server Actions):**
   - Ubicados en `src/app/actions/`, estos archivos (marcados con `'use server'`) actúan como los controladores.
   - Antes de ejecutar cualquier lógica, validan quién está haciendo la solicitud utilizando el wrapper de seguridad `requireRole(['ADMIN', 'GERENTE'])`. Esto se enlaza de forma nativa con **Supabase Auth** para verificar el token JWT de la sesión.
   - Si la autenticación y el rol son correctos, el Server Action ejecuta el ORM de **Prisma** (`prisma.client.create(...)`) para mutar la base de datos.
   - Finalmente, se invoca `revalidatePath('/ruta')` de Next.js, lo cual purga la memoria caché y actualiza la UI automáticamente sin requerir que el navegador haga un "refetch" de datos manual como en el viejo paradigma de React + Redux/Axios.

### Integración de Almacenamiento (Supabase Storage)
Para el Gestor Documental Técnico (DMS), los archivos binarios (PDFs, Planos) siguen un flujo de 2 partes:
1. **Subida en el Borde:** El navegador del usuario sube el archivo *directamente* a los buckets de **Supabase Storage** a través del cliente Supabase del frontend, evadiendo pasar megabytes de datos por el servidor de Next.js.
2. **Registro Relacional:** Una vez que Supabase confirma la subida y devuelve la URL del archivo, el cliente llama a un Server Action de Prisma para registrar el metadato del documento (Versión, Fecha, Autor, Carpeta y URL) asociado al ID del Proyecto correspondiente.

---

## 🚀 Guía de Despliegue

Este repositorio está preparado para integración y despliegue continuo (CI/CD) en plataformas nativas como **Vercel** o **Railway**.

### 1. Variables de Entorno (Producción)
Se requieren estrictamente los siguientes secretos para poder inicializar los contenedores:
```env
# Prisma Connection Pooler
DATABASE_URL="postgres://postgres.xxx:xxx@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.xxx:xxx@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# Supabase Auth & Storage API
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1..."
```

### 2. Comandos de Compilación
El flujo estándar es detectado automáticamente por `npm run build`:
```bash
npm install
npx prisma generate
next build
```

---
<p align="center">
  <i>Construido para velocidad. Diseñado para escalar.</i>
</p>
