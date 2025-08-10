### **Archivo 5: `04_PROMPT_BACKEND_GESTION_EQUIPO_ROBUSTA.md`**

**Propósito:** Este prompt instruye a la IA para crear los endpoints CRUD para la gestión de Roles y Empleados, introduciendo middlewares de autenticación y autorización para asegurar que solo los administradores puedan realizar estas acciones.

```markdown
# Prompt: Implementación de Gestión de Equipo con Autorización (TypeScript, Prisma, Zod)

Actúa como un desarrollador de backend senior y arquitecto de software. Basándote en la configuración de producción del proyecto "Calendar Shift", tu tarea es implementar los endpoints para la gestión de roles y empleados, con un sistema de autorización robusto.

## Objetivo
Crear endpoints CRUD para Roles y Empleados. Estas rutas deben ser accesibles únicamente por usuarios autenticados que, además, tengan un rol de "Admin" en su empresa. Se debe mantener estrictamente la arquitectura de capas (Validación, Controladores, Servicios) y la seguridad de tipos.

## Instrucciones Detalladas

### 1. Crea los Middlewares de Autenticación y Autorización

**A. `src/middlewares/auth.middleware.ts`:**
Crea un middleware que verifique el JWT.
1.  Extrae el token del encabezado `Authorization: Bearer <token>`.
2.  Si no hay token, devuelve un error `401 Unauthorized`.
3.  Verifica el token con `jsonwebtoken.verify`. Si es inválido, devuelve `403 Forbidden`.
4.  Si es válido, decodifica el payload (del tipo `JwtPayload`) y adjúntalo a `req.user`.
5.  Llama a `next()`.

**B. `src/middlewares/admin.middleware.ts`:**
Crea un middleware que verifique si el usuario es un administrador. **Este middleware debe ejecutarse siempre DESPUÉS de `auth.middleware.ts`**.
1.  Asegúrate de que `req.user` existe.
2.  Toma el `roleId` de `req.user`.
3.  Consulta la base de datos (usando Prisma) para obtener el nombre del rol asociado a ese `roleId`.
4.  Si el nombre del rol es exactamente "Admin", llama a `next()`.
5.  De lo contrario, devuelve un error `403 Forbidden` con un mensaje claro como "Access denied. Admin privileges required.".

### 2. Implementa la Gestión de Roles

**A. Validación y Tipos (`src/validations/role.validation.ts`):**
*   Crea un `createRoleSchema` con Zod para validar el `body` (`name: string`, `description: string?`, `color: string?`).
*   Infiere y exporta el tipo `CreateRoleBody` desde el esquema.

**B. Servicio (`src/services/role.service.ts`):**
*   **`create(data: CreateRoleBody, companyId: number)`:**
    *   Verifica si ya existe un rol con el mismo nombre para esa `companyId`. Si es así, lanza un error.
    *   Crea el nuevo rol usando Prisma.
*   **`findByCompany(companyId: number)`:**
    *   Devuelve una lista de todos los roles para la `companyId` especificada.

**C. Controlador (`src/controllers/role.controller.ts`):**
*   Crea los handlers `createRoleHandler` y `getRolesHandler`, que llaman a los métodos del servicio correspondientes y manejan las respuestas HTTP y los errores (pasándolos a `next`).

**D. Rutas (`src/routes/role.routes.ts`):**
*   Crea un router para `/api/roles`.
*   Protege todas las rutas con la secuencia de middlewares: `authMiddleware`, `adminMiddleware`, y luego el middleware de validación si es necesario (ej: `validateBody(createRoleSchema)`).
    *   `POST /`: `authMiddleware`, `adminMiddleware`, `validateBody(createRoleSchema)`, `createRoleHandler`
    *   `GET /`: `authMiddleware`, `adminMiddleware`, `getRolesHandler`

### 3. Implementa la Gestión de Empleados

**A. Validación y Tipos (`src/validations/employee.validation.ts`):**
*   Crea un `addEmployeeSchema` con Zod (`email: string`, `firstName: string`, `lastName: string`, `roleId: number`, `position: string?`).
*   Infiere y exporta el tipo `AddEmployeeBody`.

**B. Servicio (`src/services/employee.service.ts`):**
*   **`add(data: AddEmployeeBody, companyId: number)`:**
    *   **Validación de Permisos:** Verifica que el `roleId` proporcionado en `data` realmente pertenezca a la `companyId` del administrador. Si no, lanza un error de seguridad.
    *   Usa una transacción de Prisma.
    *   Busca si ya existe un `user` con el `email` proporcionado.
    *   Si el usuario no existe, créalo (con una contraseña temporal aleatoria y segura, ya que el flujo de invitación formal es post-MVP).
    *   **Verifica si el usuario ya es empleado de esa compañía** para evitar duplicados. Si ya lo es, lanza un error.
    *   Crea el vínculo en la tabla `company_employees`.
*   **`findByCompany(companyId: number)`:**
    *   Devuelve una lista de todos los empleados de la empresa.
    *   **Importante:** Usa `include` de Prisma para traer también los datos anidados de `user` (nombre, email) y `role` (nombre del rol).

**C. Controlador (`src/controllers/employee.controller.ts`):**
*   Crea los handlers `addEmployeeHandler` y `getEmployeesHandler`.

**D. Rutas (`src/routes/employee.routes.ts`):**
*   Crea un router para `/api/employees`.
*   Protege todas las rutas con `authMiddleware` y `adminMiddleware`.

### 4. Actualiza `src/app.ts`
Registra los nuevos routers para que la aplicación los utilice:```typescript
// Fragmento para añadir a src/app.ts
import roleRouter from './routes/role.routes';
import employeeRouter from './routes/employee.routes';
// ...
app.use('/api/roles', roleRouter);
app.use('/api/employees', employeeRouter);
// ...
```

## Salida Esperada
Genera el contenido completo de todos los nuevos archivos necesarios para implementar estas funcionalidades:
*   `src/middlewares/auth.middleware.ts`
*   `src/middlewares/admin.middleware.ts`
*   `src/validations/role.validation.ts`
*   `src/services/role.service.ts`
*   `src/controllers/role.controller.ts`
*   `src/routes/role.routes.ts`
*   `src/validations/employee.validation.ts`
*   `src/services/employee.service.ts`
*   `src/controllers/employee.controller.ts`
*   `src/routes/employee.routes.ts`
*   El `src/app.ts` actualizado.
```