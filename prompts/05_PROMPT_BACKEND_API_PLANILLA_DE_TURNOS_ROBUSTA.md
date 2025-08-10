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

*   **`create_shift_schema`:**
    *   Valida el `body` de la solicitud para crear un turno.
    *   `company_employee_id`: `number` (el ID del registro en la tabla `company_employees`).
    *   `shift_date`: `string`, debe poder ser interpretado como una fecha (ej: `z.coerce.date()`).
    *   `start_time`: `string`, formato 'HH:mm'.
    *   `end_time`: `string`, formato 'HH:mm'.
    *   `notes`: `string`, opcional.
*   **`update_shift_schema`:**
    *   Similar a `createShiftSchema`, pero todos los campos son opcionales (`.optional()`) para permitir actualizaciones parciales.
*   **`get_shifts_schema`:**
    *   Valida el `query` de la solicitud para obtener turnos.
    *   `start_date`: `string` (fecha), opcional.
    *   `end_date`: `string` (fecha), opcional.
*   **Tipos TypeScript:**
    *   Infiere y exporta los tipos `create_shift_body`, `update_shift_body` y `get_shifts_query` desde los esquemas Zod.

### 2. Crea el Servicio de Turnos (Capa de Servicio)

En `src/services/`, crea el archivo `shift.service.ts`.

*   **`create(data: create_shift_body, admin_company_id: number)`:**
    1.  **Validación de Permisos:** Antes de crear el turno, verifica que el `company_employee_id` proporcionado pertenece a la misma `admin_company_id`. Si no coincide, lanza un error de autorización (`UNAUTHORIZED_COMPANY_ACCESS`).
    2.  **Validación de No Solapamiento:** Para el mismo `company_employee_id` y `shift_date`, consulta los turnos existentes (con `deleted_at` nulo) y verifica que el intervalo [start_time, end_time) del nuevo turno no se solape con ninguno existente. Si se detecta solapamiento, lanza `SHIFT_OVERLAP` (HTTP 409).
    3.  Crea el nuevo `shift` en la base de datos dentro de una transacción, registrando quién lo creó (`created_by`).
*   **`find_by_company(query: get_shifts_query, company_id: number)`:**
    1.  Construye una cláusula `where` de Prisma para filtrar los turnos por `company_id`.
    2.  Si `start_date` y `end_date` están presentes en `query`, añade al `where` la condición para filtrar por el rango de `shift_date`.
    3.  Realiza la consulta a la base de datos, usando `include` para traer los datos del empleado (`company_employee` -> `user`).
    4.  Devuelve la lista de turnos.
*   **`update(shift_id: number, data: update_shift_body, admin_company_id: number)`:**
    1.  Verifica que el `shift` que se intenta actualizar (`shift_id`) pertenece a un empleado de la `admin_company_id`.
    2.  Si cambian `shift_date`, `start_time` o `end_time`, valida nuevamente no solapamiento con el resto de turnos del empleado usando intervalos [start_time, end_time).
    3.  Actualiza el turno con los nuevos datos dentro de una transacción.
*   **`delete(shift_id: number, admin_company_id: number)`:**
    1.  Verifica que el `shift` que se intenta borrar pertenece a un empleado de la `admin_company_id`.
    2.  Realiza un borrado lógico (actualizando el campo `deleted_at`).

### 2.1 Reglas MVP de Turnos

- Se permiten múltiples turnos por empleado por día.
- No se permiten turnos overnight (rechazar si `end_time <= start_time`).
- No se permiten solapamientos en el mismo día y empleado. Definir los intervalos como medio-abiertos [start_time, end_time) para permitir adyacencias (p.ej., 09:00–13:00 y 13:00–17:00).

### 2.2 Validación en Servicio (con transacción)

- Antes de crear/actualizar, ejecutar la validación de pertenencia y no solapamiento dentro de una transacción para evitar condiciones de carrera.
- Todas las consultas deben excluir registros con `deleted_at` no nulo.

### 3. Crea el Controlador de Turnos (Capa de Controlador)

En `src/controllers/`, crea el archivo `shift.controller.ts`.
*   Crea los handlers `create_shift_handler`, `get_shifts_handler`, `update_shift_handler` y `delete_shift_handler`.
*   Cada handler debe:
    *   Estar correctamente tipado.
    *   Llamar al método correspondiente del servicio.
    *   Manejar las respuestas HTTP y los errores (pasándolos a `next`).
*   Extraer `company_id` del `req.user` para pasarlo al servicio.

### 4. Define las Rutas de Turnos (Capa de Rutas)

En `src/routes/`, crea el archivo `shift.routes.ts`.
*   Crea un router para shifts y, en `src/app.ts`, móntalo bajo el prefijo `/api/v1/shifts`.
*   Protege todas las rutas con `authMiddleware` y `adminMiddleware`.
*   Aplica los middlewares de validación correspondientes (`validateBody`, `validateQuery`) a cada ruta.
    *   `POST /`: `validate_body(create_shift_schema)`, `create_shift_handler`
    *   `GET /`: `validate_query(get_shifts_schema)`, `get_shifts_handler`
    *   `PUT /:id`: `validate_body(update_shift_schema)`, `update_shift_handler`
    *   `DELETE /:id`: `delete_shift_handler`

### 5. Actualiza `src/app.ts`

Registra el nuevo router bajo `/api/v1/shifts`:
```typescript
// Fragmento para añadir a src/app.ts
import shiftRouter from './routes/shift.routes';
// ...
app.use('/api/v1/shifts', shiftRouter);
// ...
```

### 6. Contrato de Respuesta y Swagger

- Responder usando el contrato global `{ success, data, error, meta }` con campos internos en snake_case (por ejemplo, `error.error_code`, `meta.pagination.page_size`).
- Documentar en Swagger (OpenAPI 3) las rutas `/api/v1/shifts` incluyendo ejemplos y códigos 201/200/400/401/403/404/409 (`SHIFT_OVERLAP`).

## Salida Esperada
Genera el contenido completo de los nuevos archivos necesarios para implementar estas funcionalidades:
*   `src/validations/shift.validation.ts`
*   `src/services/shift.service.ts`
*   `src/controllers/shift.controller.ts`
*   `src/routes/shift.routes.ts`
*   El `src/app.ts` actualizado.
```