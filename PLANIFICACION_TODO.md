### **Plan de Desarrollo: Calendar Shift**

Este documento es la guía maestra para el desarrollo de la aplicación. Describe las fases, los objetivos y los archivos de prompt específicos que se utilizarán para generar el código con la asistencia de IA.

---

### **Fase 1: Fundación y Base de Datos (El Cimiento)**

**Objetivo:** Establecer la arquitectura completa del proyecto y construir la base de datos para el Producto Mínimo Viable (MVP).

*   **Archivo 1: `00_ARQUITECTURA_BASE_DE_DATOS_FINAL.md`**
    *   **Propósito:** Es el documento de **referencia interna** y la "Constitución" del proyecto. Contiene la visión completa del producto, el stack tecnológico y el diseño **final y completo** de la base de datos (con todas las tablas, vistas y triggers).
    *   **Uso:** No se utiliza directamente como prompt en la fase inicial. Sirve como guía estratégica para asegurar que todas las decisiones de desarrollo sean coherentes con la visión a largo plazo.

*   **Archivo 2: `01_PROMPT_MVP_BASE_DE_DATOS.md`**
    *   **Propósito:** Es la **orden de trabajo** para la IA. Contiene un subconjunto del Plano Maestro, detallando únicamente las tablas y campos necesarios para el MVP.
    *   **Uso:** Este es el primer prompt técnico que se le da a la IA para generar los scripts SQL de la base de datos inicial.

#### Decisiones MVP (críticas)

- Fuente de verdad del esquema: Prisma (migraciones). El SQL del Prompt 01 es referencia conceptual para el modelado.
- Reglas de turnos: Se permiten múltiples turnos por empleado por día. No se permiten turnos overnight (no cruzar medianoche).
- Validación de solapamiento: Se implementa a nivel de servicio con transacción. Intervalos medio-abiertos [start_time, end_time) para evaluar colisiones.
- Soft delete: Campo `deleted_at` en entidades clave. Todas las lecturas/listados deben excluir registros con `deleted_at` no nulo.
- Multi-tenant: Todas las operaciones quedan acotadas por `company_id` extraído del JWT. Antes de operar, verificar que IDs (`role_id`, `company_employee_id`, `shift_id`) pertenezcan a la empresa del solicitante.
- API y documentación: Respuesta estándar `{ success, data?, error?, meta? }`. Documentación con Swagger (OpenAPI 3) en `/api/docs` con autenticación Bearer JWT. Prefijo de rutas `/api/v1`.

- Convención de nombres: usar snake_case de forma absoluta en base de datos, schema de Prisma, DTOs/validaciones, claims JWT, parámetros de query y JSON de la API.

---

### **Fase 2: Desarrollo del Backend (La Lógica)**

**Objetivo:** Crear la API REST que permitirá al frontend interactuar con la base de datos de forma segura y estructurada.

*   **Archivo 3: `02_PROMPT_BACKEND_CONFIGURACION_INICIAL_TS_PRISMA.md`**
    *   **Tarea:** Configurar el proyecto Node.js/Express, la estructura de carpetas, instalar dependencias (`express`, `pg`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`) y establecer la conexión a la base de datos.

*   **Archivo 4: `03_PROMPT_BACKEND_AUTENTICACION_TS_PRISMA.md`**
    *   **Tarea:** Crear los endpoints para registrar una nueva empresa y su administrador (`POST /api/auth/register`) y para el inicio de sesión de todos los usuarios (`POST /api/auth/login`), generando un JWT.

**Me quedé en el archivo 5.**
*   **Archivo 5: `04_PROMPT_BACKEND_GESTION_EQUIPO_ROBUSTA.md`**
    *   **Tarea:** Desarrollar los endpoints CRUD (Crear, Leer, Actualizar, Eliminar) para que un administrador gestione los roles y empleados de su propia empresa. Se debe implementar un middleware de autenticación para proteger estas rutas.

*   **Archivo 6: `05_PROMPT_BACKEND_API_PLANILLA_DE_TURNOS_ROBUSTA.md`**
    *   **Tarea:** Implementar los endpoints CRUD para la gestión de turnos (`shifts`). Esto incluye obtener los turnos para un rango de fechas, y crear, actualizar o eliminar un turno específico.

---

### **Fase 3: Desarrollo del Frontend (La Interfaz)**

**Objetivo:** Construir la interfaz de usuario con Next.js y Tailwind CSS, conectándola a los endpoints de la API creados en la Fase 2.

*   **Archivo 7: `06_PROMPT_FRONTEND_LOGIN_Y_REGISTRO.md`**
    *   **Tarea:** Generar los componentes y páginas para el registro de una nueva empresa y para el inicio de sesión de los usuarios.

*   **Archivo 8: `07_PROMPT_FRONTEND_DASHBOARD_Y_NAVEGACION.md`**
    *   **Tarea:** Crear el layout principal (dashboard) para un usuario autenticado, incluyendo la navegación principal para acceder a las diferentes secciones (Planilla, Equipo, etc.).

*   **Archivo 9: `08_PROMPT_FRONTEND_PLANILLA_SEMANAL_INTERACTIVA.md`**
    *   **Tarea:** Diseñar y construir el componente central de la aplicación: la grilla de la planilla semanal. Debe mostrar a los empleados en filas y los días en columnas, y permitir al administrador hacer clic en una celda para asignar un turno (introduciendo hora de inicio y fin).

*   **Archivo 10: `09_PROMPT_FRONTEND_GESTION_EQUIPO.md`**
    *   **Tarea:** Crear las interfaces (tablas, formularios, modales) para que el administrador pueda gestionar a sus empleados y los roles de la empresa.

*   **Archivo 11: `10_PROMPT_FRONTEND_VISTA_EMPLEADO.md`**
    *   **Tarea:** Construir la vista simplificada de solo lectura que verá un empleado al iniciar sesión, mostrando únicamente sus turnos asignados.

---

### **Fase 4: Funcionalidades Avanzadas (La Evolución Post-MVP)**

**Objetivo:** Implementar las funcionalidades complejas definidas en el Plano Maestro una vez que el MVP sea estable.

*   **Prompt Futuro: `11_PROMPT_BACKEND_PLANTILLAS_DE_TURNO.md`**
    *   **Tarea:** Implementar el CRUD para `shift_templates`.

*   **Prompt Futuro: `12_PROMPT_BACKEND_SOLICITUDES_DE_CAMBIO.md`**
    *   **Tarea:** Construir la lógica y los endpoints para el sistema de `shift_requests` (intercambios, coberturas).

*   **Prompt Futuro: `13_PROMPT_BACKEND_REGLAS_DE_NEGOCIO.md`**
    *   **Tarea:** Añadir validaciones complejas al crear turnos (ej: descanso obligatorio entre turnos, límites de horas, etc.).

*   **Prompt Futuro: `14_PROMPT_SISTEMA_DE_NOTIFICACIONES.md`**
    *   **Tarea:** Implementar el backend y frontend para el sistema de `notifications`.

---

### **Estrategia de Versionado y Prompts**

*   **Claridad y Contexto:** Cada prompt debe comenzar estableciendo un rol claro para la IA ("Actúa como...").
*   **Una Tarea por Prompt:** Mantener cada archivo de prompt enfocado en una única tarea funcional para minimizar errores.
*   **Versionado con Git:** Todo el proyecto, incluyendo la carpeta de prompts, debe estar bajo control de versiones con Git.
    *   **Estructura de Carpetas Sugerida:**
        ```
        /calendar-shift-project
        ├── /backend  (Código fuente del backend)
        ├── /frontend (Código fuente del frontend)
        └── /prompts
            ├── 00_ARQUITECTURA_BASE_DE_DATOS_FINAL.md
            ├── 01_PROMPT_MVP_BASE_DE_DATOS.md
            ├── 02_PROMPT_BACKEND_CONFIGURACION_INICIAL_TS_PRISMA.md
            ├── 03_PROMPT_BACKEND_AUTENTICACION_TS_PRISMA.md
            ├── 04_PROMPT_BACKEND_GESTION_EQUIPO_ROBUSTA.md
            └── 05_PROMPT_BACKEND_API_PLANILLA_DE_TURNOS_ROBUSTA.md
        ```
    *   **Commits Descriptivos:** Realizar un commit después de completar con éxito cada prompt. Ejemplo: `git commit -m "feat(backend): Implementa endpoints de autenticación según prompt 03"`