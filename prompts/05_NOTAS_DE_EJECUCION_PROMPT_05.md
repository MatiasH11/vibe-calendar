### 051_NOTAS_DE_EJECUCION_PROMPT_05

Propósito: Documentar qué se implementó y qué ajustes fueron necesarios tras ejecutar `05_PROMPT_BACKEND_API_PLANILLA_DE_TURNOS_ROBUSTA.md` para que la API de turnos funcione de forma clara y estable.

Implementado
- Validaciones (Zod) en `src/validations/shift.validation.ts`:
  - `create_shift_schema`, `update_shift_schema`, `get_shifts_schema` (HH:mm para horas, `YYYY-MM-DD` para fechas).
- Servicio en `src/services/shift.service.ts`:
  - `create` con validación de pertenencia (multi-tenant), rechazo de overnight, verificación de solapamiento [start, end) dentro de transacción.
  - `find_by_company` con filtro opcional por rango de fechas y `include` de `user`.
  - `update` con revalidación de solapamiento si cambian fecha/horas.
  - `delete` como soft delete (`deleted_at`).
- Controladores en `src/controllers/shift.controller.ts` con contrato `{ success, data?, error? }` y mapeo de errores (`UNAUTHORIZED_COMPANY_ACCESS`, `OVERNIGHT_NOT_ALLOWED`, `SHIFT_OVERLAP`).
- Rutas en `src/routes/shift.routes.ts` protegidas con `authMiddleware` + `adminMiddleware` y registradas en `src/app.ts` bajo `/api/v1/shifts`.

Problemas encontrados y soluciones
1) Desalineación con Prisma (campo inexistente)
- Síntoma: error de compilación al crear shift con `created_by`.
- Causa: el modelo Prisma del MVP no define `created_by`.
- Solución: eliminar `created_by` del `data` en `shift.create` y del controlador.

2) Filtros poco claros en Swagger
- Síntoma: `GET /shifts` no explicaba cómo filtrar por rango de fechas.
- Solución: documentar parámetros `start_date` y `end_date` con descripción, formato y ejemplos; añadir ejemplos de respuestas para “sin filtros” y “con rango”.

3) Ejemplos ausentes en Swagger
- Acciones: agregar schemas (components) y ejemplos de bodies/responses para Auth, Roles, Employees y Shifts; mantener rutas relativas para no duplicar `/api/v1`.

4) Reglas MVP de turnos (reforzadas)
- Rechazo de overnight (`end_time` debe ser > `start_time`).
- No solapamiento en el mismo día/empleado con intervalos medio‑abiertos [start, end).
- Validaciones dentro de transacción para evitar condiciones de carrera.

Decisiones y consideraciones
- Horas como TIME nativo en DB; en API se manejan como strings `HH:mm` validadas por Zod.
- Soft delete: `deleted_at` excluido en listados; `DELETE` realiza borrado lógico.
- Multi‑tenant: todas las operaciones verifican pertenencia por `company_id` desde el JWT.
- Swagger usa paths relativos; el `server` base es `/api/v1`.

Checklist on‑first‑run
- [ ] DB Postgres en Docker levantada y healthy (`db/docker-compose.yml`).
- [ ] `backend/.env` configurado (`DATABASE_URL`, `JWT_SECRET`, `PORT`).
- [ ] Migraciones aplicadas (`npm run prisma:migrate`).
- [ ] Token obtenido por login y cargado en Swagger (Authorize → Bearer).

Validación rápida
1) Crear shift válido: `POST /api/v1/shifts` con `{ company_employee_id, shift_date, start_time, end_time }`.
2) Listar por rango: `GET /api/v1/shifts?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`.
3) Actualizar horas sin solapar: `PUT /api/v1/shifts/{id}`.
4) Eliminar (soft delete): `DELETE /api/v1/shifts/{id}` y comprobar que no aparece en listados.


