### **Archivo 10: `09_PROMPT_FRONTEND_GESTION_EQUIPO.md`**

**Propósito:** Implementar la UI de Gestión de Equipo para Roles y Empleados con Next.js App Router, Tailwind y shadcn/ui, integrando Route Handlers como proxy seguro al backend (JWT en cookie HttpOnly).

# Prompt: Frontend - Gestión de Equipo (Roles y Empleados)

Actúa como Frontend Lead. Implementa pantallas de Roles y Empleados con listados, formularios de creación, validaciones y manejo de errores, alineado a los contratos del backend.

## Objetivo
- Secciones:
  - `/equipo/roles`: ver lista de roles y crear rol.
  - `/equipo/empleados`: ver lista de empleados y dar de alta un empleado asociado a un rol.
- Proxy seguro vía Route Handlers:
  - Adjuntar `Authorization: Bearer <token>` desde cookie `auth_token`.
  - Mantener snake_case y contrato `{ success, data, error }`.

## Requisitos Técnicos
- Next.js App Router (Server/Client Components).
- Tailwind + `shadcn/ui` + `sonner`.
- `react-hook-form` + `zod` para formularios.
- Route Handlers usan `API_BASE_URL` (solo server), no exponer al cliente.

## Estructura
```
app/
  (app)/
    equipo/
      roles/page.tsx
      empleados/page.tsx
app/api/
  roles/route.ts             # GET, POST
  employees/route.ts         # GET, POST (extender si solo existía GET)
components/
  equipo/
    RoleTable.tsx
    RoleCreateDialog.tsx
    EmployeeTable.tsx
    EmployeeCreateDialog.tsx
lib/
  types.ts                   # Role, CompanyEmployee
  api.ts                     # helpers cliente→route handlers (si no existe)
  auth.ts                    # de prompt 06 (getSession)
```

## Tipos (lib/types.ts)
- `export type Role = { id: number; company_id: number; name: string; description?: string; color?: string }`
- `export type UserPublic = { id: number; first_name: string; last_name: string; email: string }`
- `export type CompanyEmployee = { id: number; company_id: number; user_id: number; role_id: number; position?: string; is_active: boolean; user: UserPublic; role: Role }`
- `export type StandardResponse<T> = { success: boolean; data?: T; error?: { error_code: string; message: string; details?: unknown } }`

## Route Handlers (proxy)
- Reglas:
  - Leer `auth_token` de `cookies()`. Responder 401 si no está.
  - Usar `API_BASE_URL` y header `Authorization: Bearer`.
  - Propagar status y body del backend; devolver `StandardResponse` si corresponde.

### app/api/roles/route.ts
- `GET` → proxy a `GET /api/v1/roles`. Devuelve `StandardResponse<Role[]>`.
- `POST` → body `{ name: string; description?: string; color?: string }`. Proxy a `POST /api/v1/roles`.
  - Errores:
    - 409 `DUPLICATE_ROLE` → retornar con mismo código y `{ success: false, error }`.

### app/api/employees/route.ts
- `GET` → proxy a `GET /api/v1/employees`. Devuelve `StandardResponse<CompanyEmployee[]>`.
- `POST` → body `{ email: string; first_name: string; last_name: string; role_id: number; position?: string }`. Proxy a `POST /api/v1/employees`.
  - Errores:
    - 403 `UNAUTHORIZED_COMPANY_ACCESS`
    - 409 `EMPLOYEE_ALREADY_EXISTS`

## Páginas

### `/equipo/roles` (Server + Client)
- Server:
  - Fetch `GET /app/api/roles` para precargar listado.
- UI:
  - `RoleTable` (Client): tabla simple (Nombre, Descripción, Color).
  - `RoleCreateDialog` (Client): botón “Nuevo Rol” abre diálogo con formulario.
- Formulario crear rol:
  - Zod schema: `{ name: z.string().min(1), description?: z.string(), color?: z.string().regex(/^#([0-9A-Fa-f]{6})$/).optional() }`
  - Enviar a `POST /app/api/roles`.
  - UX:
    - Loading en submit, toast de éxito, limpiar y cerrar.
    - Error 409 `DUPLICATE_ROLE` → toast “Ya existe un rol con ese nombre”.

### `/equipo/empleados` (Server + Client)
- Server:
  - Fetch `GET /app/api/employees` y `GET /app/api/roles` (para el selector).
- UI:
  - `EmployeeTable` (Client): columnas: Nombre, Email, Rol, Posición, Estado.
  - `EmployeeCreateDialog` (Client): botón “Agregar Empleado” con formulario.
- Formulario alta empleado:
  - Zod schema: `{ email: z.string().email(), first_name: z.string().min(1), last_name: z.string().min(1), role_id: z.number().int(), position?: z.string() }`
  - `role_id` via `Select` o `Combobox` de shadcn/ui con lista de roles.
  - Enviar a `POST /app/api/employees`.
  - UX:
    - Loading en submit, toast éxito, refrescar tabla.
    - Errores:
      - 409 `EMPLOYEE_ALREADY_EXISTS` → mensaje claro.
      - 403 `UNAUTHORIZED_COMPANY_ACCESS` → “Rol inválido para tu empresa.”

## Componentes

### RoleTable.tsx
- Props: `roles: Role[]`.
- Tabla básica con Tailwind/shadcn-ui; estado de carga si necesario.

### RoleCreateDialog.tsx
- `Dialog` shadcn/ui con formulario `react-hook-form + zod`.
- Botones Guardar/Cancelar; disabled durante submit.

### EmployeeTable.tsx
- Props: `employees: CompanyEmployee[]`.
- Muestra `user.first_name last_name`, `user.email`, `role.name`, `position`, `is_active`.

### EmployeeCreateDialog.tsx
- `Dialog` con formulario y `Select`/`Combobox` de roles.
- Validación zod; manejo de errores de backend.

## Errores y Mensajes (estándar)
- Roles: `DUPLICATE_ROLE` → “Ya existe un rol con ese nombre en tu empresa.”
- Empleados:
  - `EMPLOYEE_ALREADY_EXISTS` → “El empleado ya existe en tu empresa.”
  - `UNAUTHORIZED_COMPANY_ACCESS` → “Rol inválido para tu empresa.”
  - `UNAUTHORIZED`/`FORBIDDEN` → “Sesión inválida o sin permisos.”

## Seguridad
- Mantener `API_BASE_URL` solo en server (Route Handlers).
- Rechazar si falta `auth_token`.

## Accesibilidad y UX
- Diálogos accesibles, focus management, atajos de cierre.
- Estados loading, deshabilitado y toasts `sonner`.

## Salida Esperada
- `app/(app)/equipo/roles/page.tsx`
- `app/(app)/equipo/empleados/page.tsx`
- `app/api/roles/route.ts`
- `app/api/employees/route.ts` (GET/POST)
- `components/equipo/RoleTable.tsx`
- `components/equipo/RoleCreateDialog.tsx`
- `components/equipo/EmployeeTable.tsx`
- `components/equipo/EmployeeCreateDialog.tsx`
- `lib/types.ts` actualizado


