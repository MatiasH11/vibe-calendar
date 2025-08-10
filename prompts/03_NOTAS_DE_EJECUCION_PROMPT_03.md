### 031_NOTAS_DE_EJECUCION_PROMPT_03

Propósito: Documentar los ajustes necesarios desde que se ejecutó `03_PROMPT_BACKEND_AUTENTICACION_TS_PRISMA.md` hasta dejar los endpoints de autenticación operativos.

#### Resumen de lo implementado
- Validaciones Zod y tipos: `register_schema`, `login_schema` (`src/validations/auth.validation.ts`).
- Servicio de auth con transacción: crea `company`, `user`, rol `Admin`, `company_employee`; `login` firma JWT con claims (`src/services/auth.service.ts`).
- Controladores tipados y mapeo de errores a HTTP: `register_handler`, `login_handler` (`src/controllers/auth.controller.ts`).
- Rutas y Swagger: `POST /auth/register`, `POST /auth/login` bajo `/api/v1` (`src/routes/auth.routes.ts`) y registro en `src/app.ts`.

#### Problemas encontrados y soluciones
1) Error de compilación al crear `company`
- Síntoma: TS2322 – faltaba `email` en `company.create({ data: { name } })`.
- Causa: El modelo Prisma del MVP requiere `email` en `company`.
- Fix: Añadir `email: data.email` al `data` de `company.create` en `auth.service.ts`.

2) Doble prefijo en Swagger (`/api/v1/api/v1/...`)
- Síntoma: Swagger intentaba llamar `/api/v1/api/v1/auth/register`.
- Causa: `servers` en Swagger con base `/api/v1` + anotaciones usando rutas absolutas `/api/v1/...`.
- Fix: Cambiar anotaciones OpenAPI a rutas relativas (`/auth/register` y `/auth/login`) en `src/routes/auth.routes.ts`.

3) Consideraciones de entorno (heredadas de Prompt 02 pero necesarias para probar 03)
- `.env` en `backend` con `DATABASE_URL`, `JWT_SECRET`, `PORT`.
- Migraciones Prisma aplicadas: `npm run prisma:migrate`.
- Script `dev` compatible Windows (comillas escapadas) ya corregido en Prompt 02.

#### Validación rápida
- Registro: `POST /api/v1/auth/register` con body snake_case → 201 `{ success: true, data: { company_id, user_id, role_id, employee_id } }`.
- Login: `POST /api/v1/auth/login` → 200 `{ success: true, data: { token } }`.
- Swagger en `/api/docs` muestra rutas bajo `/api/v1` sin duplicación.

#### Recomendaciones
- Mantener snake_case en requests/responses.
- Centralizar códigos de error en constantes si crece el catálogo.
- En futuro multi-company por usuario: permitir seleccionar `company_id` en `login`.


