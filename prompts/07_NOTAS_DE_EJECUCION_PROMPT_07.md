### Notas de Ejecución - Prompt 07 (Frontend: Dashboard y Navegación)

Resumen directo de lo que se agregó/ajustó más allá del prompt para que todo funcione correctamente.

#### 1) Rutas y páginas necesarias para evitar 404
- Se crearon páginas placeholder para todas las entradas del sidebar:
  - `/dashboard`, `/planilla`, `/equipo/roles`, `/equipo/empleados`, `/mi/turnos`.
- El logo del sidebar enlaza a `/dashboard`.

#### 2) Redirecciones coherentes (sin segmentos del App Router en URL)
- Post-login y post-registro redirigen a `/dashboard` (antes `/(app)`).
- Enlaces entre auth usan rutas limpias: `/login` ↔ `/register`.

#### 3) Middleware ajustado
- Rutas públicas: `/login`, `/register`, `/api` y `/_next` (assets Next), para evitar redirecciones erróneas.
- Si hay cookie `auth_token` y se visita `/login` o `/register`, se redirige a `/dashboard`.

#### 4) Logout con redirección inmediata
- `POST /api/auth/logout` ahora:
  - Limpia la cookie `auth_token`.
  - Redirige automáticamente a `/login` con `NextResponse.redirect(...)`.

#### 5) Providers de estado (integración con 07.1)
- Se añadieron y usaron providers en `app/(app)/layout.tsx`:
  - `AppProviders` (React Query + `<Toaster />`).
  - Aliases TS para `@/providers/*` configurados en `tsconfig.json`.

#### 6) Dependencias y utilidades
- Paquetes añadidos: `@tanstack/react-query`, `@tanstack/react-query-devtools`.
- `lib/routes.ts` centraliza rutas y items del sidebar.


