# Plataforma de Gestión Empresarial Integrada 🚀

Plataforma operativa y de gestión de proyectos diseñada para administrar almacenes, proyectos de clientes, control documental técnico (DMS) y proveer un centro de mando en tiempo real. Construida con un stack moderno y escalable.

## 🛠️ Stack Tecnológico

*   **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
*   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
*   **Base de Datos & ORM:** [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/)
*   **Backend as a Service:** [Supabase](https://supabase.com/) (Autenticación y Storage de archivos)
*   **Iconografía:** [Lucide React](https://lucide.dev/)

## 🌟 Características Principales

### 1. 📦 Control Operativo y Almacén
*   Catálogo de productos dinámico y categorizado (ej. Eléctrico, Acero, Tubería).
*   Registro y visualización del historial de movimientos (Entradas y Salidas).
*   Validación de stock disponible.

### 2. 📊 CRM y Tablero de Proyectos (Kanban)
*   Tablero estilo Kanban para visualizar el estado de todos los proyectos (`NORMAL`, `RIESGO`, `ATORADO`).
*   Directorio de clientes y proyectos asociados.
*   Control de progreso porcentual (`0-100%`) para cada proyecto.
*   En caso de que un proyecto se marque como `ATORADO`, se exige capturar la "Razón del Bloqueo".

### 3. 📂 Gestor Documental Técnico (DMS)
*   Subida de archivos técnicos y planos al servidor seguro (Supabase Storage).
*   Control de versiones estricto (V1, V2, V3...) con control de concurrencia y protección contra sobrescritura (race-conditions).
*   Descarga y previsualización de documentos.

### 4. 📺 Centro de Comando (Visor TV)
*   Dashboard tipo "kiosco" diseñado para proyectarse en monitores o televisores de planta.
*   Diseño horizontal con auto-refresco en vivo cada 30 segundos.
*   Alerta principal con prioridad máxima para proyectos en estado `ATORADO`.

### 5. 🔒 Seguridad y Roles (RBAC)
*   Protección de rutas mediante Middleware de Next.js y Supabase Auth SSR.
*   Jerarquía de permisos estricta integrada en el Backend (Server Actions):
    *   **TÉCNICO:** Puede ver datos y registrar movimientos de stock / documentos.
    *   **GERENTE:** Puede crear clientes, productos, proyectos y cambiar estados.
    *   **ADMIN:** Control total del sistema.

## ⚙️ Configuración y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/en/) (v18+)
- Una cuenta y un proyecto en [Supabase](https://supabase.com/).

### Pasos de Instalación

1.  **Clonar el repositorio**
    ```bash
    git clone https://github.com/DAKADURO/plataforma.git
    cd plataforma
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**
    Crea un archivo `.env` en la raíz del proyecto y agrega tus claves de Supabase:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
    DATABASE_URL=tu-cadena-de-conexion-postgres
    DIRECT_URL=tu-cadena-de-conexion-directa
    ```

4.  **Generar el Cliente de Prisma y Sincronizar**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Iniciar el servidor de desarrollo**
    ```bash
    npm run dev
    ```
    Visita `http://localhost:3000` en tu navegador. El sistema te pedirá iniciar sesión.

---
*Desarrollado con pasión para transformar el control y seguimiento empresarial.*
