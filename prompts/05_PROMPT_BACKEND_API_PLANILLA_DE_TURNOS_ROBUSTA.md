### **Archivo 6: `05_PROMPT_BACKEND_API_PLANILLA_DE_TURNOS_ROBUSTA.md`**

**Propósito:** Este prompt instruye a la IA para implementar los endpoints CRUD para la gestión de turnos (`shifts`). Las rutas estarán protegidas para asegurar que solo los administradores puedan modificar la planilla.

```markdown
# Prompt: Implementación de la API de Planilla de Turnos con Arquitectura Robusta

Actúa como un desarrollador de backend senior. Basándote en la configuración de producción del proyecto "Calendar Shift", tu tarea es implementar los endpoints CRUD para la gestión de turnos (`shifts`).

## Objetivo
Crear una API segura y eficiente para que un administrador pueda asignar, ver, actualizar y eliminar turnos para los empleados de su empresa. Se debe mantener estrictamente la arquitectura de capas y aplicar la autorización correspondiente.

## Instrucciones Detalladas

### 1. Define la Validación y los Tipos (Capa de Validación)

En `src/validations/`, crea el archivo `shift.validation.ts`.

*   **`createShiftSchema`:**
    *   Valida el `body` de la solicitud para crear un turno.
    *   `companyEmployeeId`: `number` (el ID del registro en la tabla `company_employees`).
    *   `shiftDate`: `string`, debe poder ser interpretado como una fecha (ej: `z.coerce.date()`).
    *   `startTime`: `string`, formato 'HH:mm'.
    *   `endTime`: `string`, formato 'HH:mm'.
    *   `notes`: `string`, opcional.
*   **`updateShiftSchema`:**
    *   Similar a `createShiftSchema`, pero todos los campos son opcionales (`.optional()`) para permitir actualizaciones parciales.
*   **`getShiftsSchema`:**
    *   Valida el `query` de la solicitud para obtener turnos.
    *   `startDate`: `string` (fecha), opcional.
    *   `endDate`: `string` (fecha), opcional.
*   **Tipos TypeScript:**
    *   Infiere y exporta los tipos `CreateShiftBody`, `UpdateShiftBody` y `GetShiftsQuery` desde los esquemas Zod.

### 2. Crea el Servicio de Turnos (Capa de Servicio)

En `src/services/`, crea el archivo `shift.service.ts`.

*   **`create(data: CreateShiftBody, adminCompanyId: number)`:**
    1.  **Validación de Permisos:** Antes de crear el turno, verifica que el `companyEmployeeId` proporcionado pertenece a la misma `adminCompanyId`. Esto es crucial para evitar que un admin de una empresa asigne turnos a empleados de otra. Si no coincide, lanza un error de autorización.
    2.  **Validación de Solapamiento:** Verifica si ya existe un turno para ese `companyEmployeeId` en esa `shiftDate`. Si es así, lanza un error (`SHIFT_ALREADY_EXISTS`).
    3.  Crea el nuevo `shift` en la base de datos, registrando quién lo creó (`created_by`).
*   **`findByCompany(query: GetShiftsQuery, companyId: number)`:**
    1.  Construye una cláusula `where` de Prisma para filtrar los turnos por `companyId`.
    2.  Si `startDate` y `endDate` están presentes en `query`, añade al `where` la condición para filtrar por el rango de `shiftDate`.
    3.  Realiza la consulta a la base de datos, usando `include` para traer los datos del empleado (`company_employee` -> `user`).
    4.  Devuelve la lista de turnos.
*   **`update(shiftId: number, data: UpdateShiftBody, adminCompanyId: number)`:**
    1.  Verifica que el `shift` que se intenta actualizar (`shiftId`) pertenece a un empleado de la `adminCompanyId`.
    2.  Actualiza el turno con los nuevos datos.
*   **`delete(shiftId: number, adminCompanyId: number)`:**
    1.  Verifica que el `shift` que se intenta borrar pertenece a un empleado de la `adminCompanyId`.
    2.  Realiza un borrado lógico (actualizando el campo `deleted_at`).

### 3. Crea el Controlador de Turnos (Capa de Controlador)

En `src/controllers/`, crea el archivo `shift.controller.ts`.
*   Crea los handlers `createShiftHandler`, `getShiftsHandler`, `updateShiftHandler` y `deleteShiftHandler`.
*   Cada handler debe:
    *   Estar correctamente tipado.
    *   Llamar al método correspondiente del servicio.
    *   Manejar las respuestas HTTP y los errores (pasándolos a `next`).
    *   Extraer `companyId` del `req.user` para pasarlo al servicio.

### 4. Define las Rutas de Turnos (Capa de Rutas)

En `src/routes/`, crea el archivo `shift.routes.ts`.
*   Crea un router para `/api/shifts`.
*   Protege todas las rutas con `authMiddleware` y `adminMiddleware`.
*   Aplica los middlewares de validación correspondientes (`validateBody`, `validateQuery`) a cada ruta.
    *   `POST /`: `validateBody(createShiftSchema)`, `createShiftHandler`
    *   `GET /`: `validateQuery(getShiftsSchema)`, `getShiftsHandler`
    *   `PUT /:id`: `validateBody(updateShiftSchema)`, `updateShiftHandler`
    *   `DELETE /:id`: `deleteShiftHandler`

### 5. Actualiza `src/app.ts`

Registra el nuevo router para que la aplicación lo utilice.
```typescript
// Fragmento para añadir a src/app.ts
import shiftRouter from './routes/shift.routes';
// ...
app.use('/api/shifts', shiftRouter);
// ...
```

## Salida Esperada
Genera el contenido completo de los nuevos archivos necesarios para implementar estas funcionalidades:
*   `src/validations/shift.validation.ts`
*   `src/services/shift.service.ts`
*   `src/controllers/shift.controller.ts`
*   `src/routes/shift.routes.ts`
*   El `src/app.ts` actualizado.
```