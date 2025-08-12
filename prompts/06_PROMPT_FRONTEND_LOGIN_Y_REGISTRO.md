### **Archivo 7: `06_PROMPT_FRONTEND_LOGIN_Y_REGISTRO.md`**

**Propósito:** Instruir la creación del frontend base con Next.js (App Router) y Tailwind para soportar Registro y Login contra el backend, manejando sesión segura con cookie HttpOnly y protección de rutas.

```markdown
# Prompt: Frontend - Login y Registro (Next.js App Router, Tailwind, Zod)

Actúa como Frontend Lead. Tu tarea es crear la base del frontend para "Calendar Shift" usando Next.js (App Router) y Tailwind, implementando las páginas de Registro y Login, manejo de JWT en cookie HttpOnly mediante Route Handlers (proxy al backend), y protección de rutas autenticadas.

## Objetivo
Entregar un frontend inicial funcional que permita:
- Registrar empresa y administrador (`/api/v1/auth/register`) y hacer login (`/api/v1/auth/login`) contra el backend.
- Guardar el JWT en una cookie HttpOnly y exponer un estado de sesión básico en el servidor.
- Proteger todo `/(app)` y dejar público `/(auth)`.

## Instrucciones Detalladas

### 1) Configuración del Proyecto
- Scaffolding Next.js con TypeScript y App Router (`app/`).
- Instalar dependencias:
  - UI: `tailwindcss postcss autoprefixer`
  - Formularios y validación: `react-hook-form zod @hookform/resolvers`
  - Utilidades: `clsx` (opcional), `jwt-decode` (solo si lees claims en server components sin verificar)
- Configurar Tailwind:
  - `tailwind.config.ts`, `postcss.config.js`, `app/globals.css`
- Variables de entorno:
  - `API_BASE_URL` (solo servidor; usado en route handlers para consumir backend)
- Scripts recomendados:
  - `"dev": "next dev"`, `"build": "next build"`, `"start": "next start"`

### 1.1) Librería de componentes recomendada: shadcn/ui
- Inicialización (no interactiva):
  - `npx shadcn@latest init -d`
- Dependencias complementarias:
  - `lucide-react` (iconos)
  - `sonner` (toasts)
- Añadir componentes base (ejecutar):
  - `npx shadcn@latest add button input label form dialog dropdown-menu sheet select textarea`
- Toaster global (con `sonner`):
  - Renderiza `<Toaster />` de `sonner` en `app/(app)/layout.tsx` (o `app/layout.tsx`).

### 1.2) Estrategia de red (recomendada)
- Todas las llamadas al backend deben realizarse desde Route Handlers (o Server Components/Actions) del lado del servidor.
- No llames al backend directamente desde el cliente para evitar exponer el token o `API_BASE_URL`.
- `API_BASE_URL` debe usarse únicamente en código de servidor (Route Handlers/Server Components).

### 2) Estructura de Carpetas (mínima requerida)
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (app)/
    layout.tsx        # layout autenticado (placeholder mínimo en este prompt)
  api/
    auth/
      login/route.ts      # POST
      register/route.ts   # POST
      logout/route.ts     # POST
components/
  ui/
    button.tsx, input.tsx, label.tsx, form.tsx, dialog.tsx, select.tsx, textarea.tsx, dropdown-menu.tsx, sheet.tsx
lib/
  api.ts        # fetcher hacia Route Handlers
  auth.ts       # helpers de sesión (server-side)
middleware.ts
styles/
  globals.css

### 3) Route Handlers (proxy seguro al backend)
- `app/api/auth/login/route.ts` (POST):
  - Valida body: `{ email, password }` (snake_case).
  - Llama a `POST ${API_BASE_URL}/api/v1/auth/login`.
  - Si `success`, extrae token (JWT) desde `data` del backend y setea cookie `auth_token` con:
    - `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: '/'`, `maxAge` alineado al `JWT_EXPIRATION` backend.
  - Devuelve `{ success, data }` o `{ success: false, error }` según contrato del backend.
- `app/api/auth/register/route.ts` (POST):
  - Valida body: `{ company_name, first_name, last_name, email, password }`.
  - Llama a `POST ${API_BASE_URL}/api/v1/auth/register`.
  - Si `success`, opcionalmente realizar login automático:
    - Llama internamente al endpoint de login para setear cookie `auth_token`.
  - Devuelve `{ success, data }` o `{ success: false, error }`.
- Consideraciones:
  - Mantener snake_case en requests/responses.
  - Propagar códigos HTTP adecuados (400/401/409) y `error.error_code` en la respuesta.

- `app/api/auth/logout/route.ts` (POST):
  - Borra la cookie `auth_token` estableciendo `Max-Age=0` (o `expires` en el pasado), con los mismos flags de seguridad usados al setearla (`httpOnly`, `secure`, `sameSite`, `path`, `domain`).
  - Opcional: borrar cookies auxiliares relacionadas a sesión si existieran.
  - Devuelve `204 No Content` o `{ success: true }` para indicar que la sesión local fue cerrada.

### 3.1) Patrón de proxy y autorización (recomendado)
- Crea un helper reutilizable para comunicarte con el backend y adjuntar `Authorization: Bearer` desde la cookie `auth_token`.

```ts
// app/api/_utils/backend.ts
export async function backendFetch(path: string, init: RequestInit & { token?: string } = {}) {
  const base = process.env.API_BASE_URL!;
  const headers = new Headers(init.headers);
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`);
  headers.set('Content-Type', 'application/json');
  return fetch(`${base}${path}`, { ...init, headers, cache: 'no-store' });
}
```

```ts
// Ejemplo: app/api/roles/route.ts (GET)
import { cookies } from 'next/headers';
import { backendFetch } from '../_utils/backend';

export async function GET() {
  const token = cookies().get('auth_token')?.value;
  if (!token) {
    return new Response(
      JSON.stringify({ success: false, error: { error_code: 'UNAUTHORIZED', message: 'Missing token' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const res = await backendFetch('/api/v1/roles', { token });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
```

### 4) Manejo de Sesión en el Servidor
- `lib/auth.ts`:
  - `getSession(cookies)`:
    - Lee cookie `auth_token`; si existe, retorna objeto de sesión básico con flags (`isAuthenticated: true`) y, opcionalmente, claims decodificados (sin verificar) para mostrar nombre/rol.
    - Si no existe, `isAuthenticated: false`.
  - `isAuthenticated(cookies)` helper.
  - Nota: no verifiques el JWT en frontend; la verificación vive en backend. El middleware solo comprueba existencia de cookie.
- `middleware.ts`:
  - Protege todo `/(app)`:
    - Si no hay `auth_token`, redirigir a `/(auth)/login`.
    - Dejar pasar `/(auth)` y assets.
  - Opcional: crea `app/api/auth/session/route.ts` que lea `getSession(cookies)` y devuelva datos mínimos no sensibles (p. ej., `is_authenticated`, `role_name`, `employee_id`) para hidratar UI del cliente si fuese necesario.
  - Logout (flujo): desde cualquier componente/acción del cliente, hacer `POST /api/auth/logout` y redirigir luego a `/(auth)/login`.

### 5) Formularios de Login y Registro
- `app/(auth)/login/page.tsx`:
  - Form con `react-hook-form` + Zod:
    - Esquema: `{ email: z.string().email(), password: z.string().min(8) }`
  - Envía a `POST /app/api/auth/login`.
  - Muestra errores del contrato (`error.error_code`, mensajes de validación).
- `app/(auth)/register/page.tsx`:
  - Form con `react-hook-form` + Zod:
    - Esquema: `{ company_name, first_name, last_name, email, password }` (snake_case)
  - Envía a `POST /app/api/auth/register` y, si se implementa login automático, redirige a `/(app)` tras éxito.
- Accesibilidad y UX:
  - Botones deshabilitados mientras envía, toasts/alerts para errores, feedback visual claro.
- Componentes UI (shadcn/ui) recomendados en los formularios:
  - `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Input`, `Button`, `Dialog`.
  - Para toasts, usar `sonner` (`import { Toaster, toast } from 'sonner'`).

### 6) Convenciones y Tipos
- Mantén snake_case en DTOs para consistencia con el backend.
- Define tipos para respuestas:
  - `StandardResponse<T>` con `{ success: boolean; data?: T; error?: { error_code: string; message: string; details?: unknown }; meta?: unknown }`
- `lib/api.ts`:
  - `postJson<TRequest, TResponse>(path: string, body: TRequest): Promise<StandardResponse<TResponse>>`
  - Se comunica con los Route Handlers (no directamente con el backend desde el cliente).

### 7) Seguridad
- Cookies HttpOnly para el token.
- Nunca exponer `API_BASE_URL` al cliente; solo usarlo en route handlers (código del servidor).
- Redirecciones y guardas en `middleware.ts`.
 - Producción:
   - Cookie `auth_token` con `secure: true`, `sameSite: 'lax'` (o `'strict'` según UX de SSO), `path: '/'` y `domain` apuntando al dominio público.
   - Alinear `maxAge` con `JWT_EXPIRATION` del backend.

## Salida Esperada
Genera el contenido completo y funcional de:
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/(app)/layout.tsx` (skeleton mínimo)
- `middleware.ts`
- `lib/api.ts`
- `lib/auth.ts`
- Configuración de Tailwind (`tailwind.config.ts`, `postcss.config.js`, `app/globals.css`)
- Componentes shadcn/ui generados: `button`, `input`, `label`, `form`, `dialog`, `dropdown-menu`, `sheet`, `select`, `textarea`.
- Toaster de `sonner` montado en el layout autenticado.
 - `app/api/_utils/backend.ts` (helper de proxy y autorización hacia el backend).
 - Opcional: `app/api/auth/session/route.ts` (exponer estado mínimo de sesión para UI cliente).
  - `app/api/auth/logout/route.ts` (cierre de sesión: limpieza de cookie `auth_token`).

```

