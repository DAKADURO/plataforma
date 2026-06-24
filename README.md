<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield.svg" width="80" alt="Logo">
  <h1 align="center">Menrit Sears - Plataforma Operativa B2B</h1>
  
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
