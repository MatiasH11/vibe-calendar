### 041_NOTAS_DE_EJECUCION_PROMPT_04

Propósito: Qué faltó y qué se corrigió al implementar `04_PROMPT_BACKEND_GESTION_EQUIPO_ROBUSTA.md` para que funcione a la primera.

Implementado
- Middlewares: `auth.middleware.ts` (verifica JWT y setea `req.user`), `admin.middleware.ts` (verifica rol `Admin`).
- Tipado Express: `src/types/express.d.ts` para `req.user: jwt_payload`.
- Roles: validación (`create_role_schema`), servicio (`create`, `find_by_company`), controladores y rutas (`POST/GET /api/v1/roles`).
- Empleados: validación (`add_employee_schema`), servicio (`add`, `findByCompany`), controladores y rutas (`POST/GET /api/v1/employees`).
- Registro de routers en `src/app.ts`.

Problemas y soluciones
1) `req.user` no estaba tipado
   - Síntoma: errores de tipos al leer `company_id`/`role_id`.
   - Fix: `src/types/express.d.ts` extendiendo `Express.Request` con `jwt_payload`.

2) Falta de middlewares de seguridad
   - Síntoma: rutas sin protección o sin contexto de usuario.
   - Fix: `authMiddleware` (Bearer JWT) y `adminMiddleware` (verifica nombre de rol `Admin` en DB).

3) Duplicación del prefijo en Swagger (`/api/v1/api/v1/...`)
   - Causa: `servers` en Swagger ya define `/api/v1` y las anotaciones usaban rutas absolutas.
   - Fix: usar rutas relativas en anotaciones (`/roles`, `/employees`).

4) Scoping y validaciones multi-tenant
   - Roles: prevención de duplicados por `company_id` + `name` → `409 DUPLICATE_ROLE`.
   - Empleados: validar que `role_id` pertenezca a la empresa del admin → `403 UNAUTHORIZED_COMPANY_ACCESS`.
   - Empleados: evitar duplicado en `company_employees` → `409 EMPLOYEE_ALREADY_EXISTS`.
   - Listados: excluir registros `deleted_at` (soft delete).

5) Requisitos previos (si no, fallan las pruebas)
   - DB en Docker levantada (`db/docker-compose.yml`) y healthy.
   - `backend/.env` configurado (`DATABASE_URL`, `JWT_SECRET`, `PORT`).
   - Migraciones aplicadas: `npm run prisma:migrate`.
   - Obtener token vía `/api/v1/auth/login` y usarlo como Bearer en Swagger para `/roles` y `/employees`.

Checklist para que funcione de una
- [ ] Docker Desktop corriendo y `docker compose up -d` en `db/`.
- [ ] `backend/.env` creado y Prisma migrado.
- [ ] Login exitoso y token cargado en Swagger (Authorize → Bearer).
- [ ] Swagger con rutas relativas (no `api/v1` duplicado).

Validación rápida
1) `POST /api/v1/auth/login` → 200 con `token`.
2) `POST /api/v1/roles` con Bearer → 201 (rol creado).
3) `GET /api/v1/roles` → 200 (lista incluye el rol).
4) `POST /api/v1/employees` con Bearer → 201 (empleado creado).
5) `GET /api/v1/employees` → 200 (lista con `user` y `role`).

Notas
- Las anotaciones OpenAPI usan rutas relativas; el `servers` base ya es `/api/v1`.
- El servicio de empleados crea usuario con contraseña temporal hasheada si no existe (flujo de invitación formal: post-MVP).


