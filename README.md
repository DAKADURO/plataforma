# Menrit Sears: Plataforma de Gestión Empresarial Integrada 🚀

Plataforma operativa y de gestión de proyectos de alto nivel, diseñada bajo una estética moderna, oscura y fluida. Permite la administración integral de almacenes, gestión de proyectos de clientes, control documental técnico (DMS), visualización de analíticas y un centro de mando en tiempo real. 

## 🛠️ Stack Tecnológico

*   **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
*   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
*   **Estilos y UI:** [Tailwind CSS](https://tailwindcss.com/) (Diseño Fluido y Modo Oscuro Nativo Permanente)
*   **Base de Datos & ORM:** [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/)
*   **Backend as a Service:** [Supabase](https://supabase.com/) (Autenticación, Storage y WebSockets Real-time)
*   **Gráficas:** [Recharts](https://recharts.org/)
*   **Iconografía:** [Lucide React](https://lucide.dev/)

## 🌟 Módulos y Características Principales

### 1. 📦 Control Operativo y Almacén
*   Catálogo de productos dinámico y categorizado (ej. Eléctrico, Acero, Tubería).
*   Registro de entradas y salidas de inventario, asociadas opcionalmente a proyectos específicos.
*   Indicadores visuales de stock bajo y validación de inventario disponible.

### 2. 📊 CRM y Tablero de Proyectos (Kanban)
*   Tablero interactivo estilo Kanban para monitorear el estado operativo (`NORMAL`, `RIESGO`, `ATORADO`).
*   Directorio de clientes y proyectos vinculados con barras de progreso métricas (`0-100%`).
*   Bloqueo documentado: si un proyecto entra en estado `ATORADO`, el gerente debe capturar el "Motivo del Bloqueo", visible para todo el equipo.

### 3. 📂 Gestor Documental Técnico (DMS)
*   Repositorio seguro integrado en cada proyecto para planos y archivos técnicos (respaldado por Supabase Storage).
*   Control estricto de versiones con historial (v1, v2, v3...) para un mismo documento.
*   Registro de auditoría (quién subió la versión, fecha, notas adicionales) e hipervínculos de descarga.

### 4. 📈 Analíticas Ejecutivas y Notificaciones Real-time
*   Dashboard visual de métricas del negocio con gráficos interactivos sobre estados de proyectos y volumen de inventario.
*   **Notificaciones In-App**: Integración directa con los canales de Supabase Real-time. Si un técnico marca un proyecto como "En Riesgo" o "Atorado", se alerta inmediatamente a los gerentes activos.

### 5. 📺 Centro de Comando Operativo (Visor TV)
*   Pantalla tipo "Kiosco" o "Big Screen", diseñada específicamente para ser proyectada en grandes monitores dentro de la planta u oficina.
*   Ajuste inteligente de cuadrícula (Grid responsive auto-fit) que aprovecha cada píxel de pantallas Ultra-Wide.
*   Auto-refresco silencioso y notificaciones de parpadeo visual en proyectos críticos.

### 6. 🔒 Seguridad y Roles (RBAC)
*   La aplicación carece deliberadamente de Tema Claro; emplea una Interfaz Oscura premium e inmersiva.
*   Protección de rutas SSR mediante Supabase Auth y Middleware de Next.js.
*   Jerarquía de permisos y roles:
    *   **TÉCNICO:** Visualiza tableros, registra inventario y sube versiones de documentos. No puede cambiar los estados críticos del proyecto.
    *   **GERENTE / ADMIN:** Control total operativo, modificación de clientes, productos, asignación de bloqueos y visualización analítica.

## ⚙️ Configuración y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/en/) (v18+)
- Cuenta y proyecto activo en [Supabase](https://supabase.com/).

### Instalación

1.  **Clonar el repositorio e instalar dependencias**
    ```bash
    git clone https://github.com/DAKADURO/plataforma.git
    cd plataforma
    npm install
    ```

2.  **Configurar Variables de Entorno**
    Crea un archivo `.env` en la raíz copiando las credenciales de Supabase:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
    DATABASE_URL=tu-cadena-de-conexion-postgres
    DIRECT_URL=tu-cadena-de-conexion-directa
    ```

3.  **Generar el Cliente de Prisma y Sincronizar**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

4.  **Iniciar el servidor de desarrollo**
    ```bash
    npm run dev
    ```
    Visita `http://localhost:3000` en tu navegador. 

---
*Desarrollado para Menrit Sears, transformando el control operativo.*
