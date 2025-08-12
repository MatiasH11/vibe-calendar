### Notas de Ejecución - Prompt 06 (Frontend: Login y Registro)

Resumen breve de lo que se agregó/ajustó más allá del prompt inicial para dejar el flujo completamente funcional.

#### 1) Dependencias y utilidades extra
- Se añadieron utilidades para UI y estilos:
  - `clsx`, `tailwind-merge` y helper `lib/utils.ts (cn)`.
  - Dependencias Radix y utilidades: `@radix-ui/react-slot`, `@radix-ui/react-label`, `class-variance-authority`.

#### 2) Integración shadcn/ui en formularios
- Se incorporaron componentes base de UI para mejorar UX:
  - `components/ui/button.tsx`, `input.tsx`, `label.tsx`, `form.tsx` (wrappers para `react-hook-form`).
- Formularios de `/(auth)/login` y `/(auth)/register` migrados a estos componentes, manteniendo `react-hook-form + zod` y `sonner` para toasts.

#### 3) Middleware (ajuste práctico)
- Los grupos de rutas `(auth)` y `(app)` no se reflejan en la URL.
- Se ajustó `middleware.ts` para proteger todo excepto `/login`, `/register` y `/api`, y redirigir a `/login` si no hay cookie `auth_token`.

#### 4) Variables de entorno
- Falta operativa en el prompt: crear `frontend/.env.local` con `API_BASE_URL`.
  - Ejemplo: `API_BASE_URL=http://localhost:3001`.

#### 5) Tipos/TSConfig
- Para evitar advertencias, se quitó `"types": ["node"]` en `tsconfig.json` (o alternativamente, se puede instalar `@types/node`).

#### 6) Route Handlers (detalles)
- Login y Registro ya proxyean al backend y setean cookie HttpOnly (`auth_token`).
- Ajustes de seguridad sugeridos:
  - `httpOnly: true`, `secure` en producción, `sameSite: 'lax'`, `path: '/'`, `maxAge` alineado con backend.

#### 7) Opcionales no críticos del prompt
- Endpoint `app/api/auth/session/route.ts` (estado mínimo para hidratar UI).
- `jwt-decode` solo si se leen claims en Server Components (no necesario para el flujo base).

---

### Cambios adicionales realizados hasta ahora

- Estructura base `frontend/` creada (scaffold completo):
  - `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `app/globals.css`.
  - Layouts: `app/layout.tsx` (root) y `app/(app)/layout.tsx` con `<Toaster />`.
- Route Handlers implementados: `app/api/auth/login/route.ts`, `register/route.ts`, `logout/route.ts`.
- Helpers añadidos: `lib/api.ts`, `lib/auth.ts`, `app/api/_utils/backend.ts`.
- Ajustes de formularios con RHF para evitar errores de runtime:
  - Uso de `const form = useForm({ resolver, defaultValues })`.
  - `<Form {...form}>`, `control={form.control}` en `FormField` y `render={({ field }) => <Input {...field} />}`.
  - Reemplazo de mensajes por `<FormMessage />` ligado al estado de RHF.
- Middleware actualizado para proteger todo excepto `/login`, `/register` y `/api`.
- Variables de entorno creadas:
  - `frontend/.env.example` y `frontend/.env.local` con `API_BASE_URL=http://localhost:3001`.
- Dependencias agregadas:
  - UI/utilidades: `class-variance-authority`, `@radix-ui/react-slot`, `@radix-ui/react-label`, `clsx`, `tailwind-merge`.
  - Core ya presente: `react`, `next`, `zod`, `react-hook-form`, `@hookform/resolvers`, `sonner`, `lucide-react`.
- Tailwind configurado con `content` apuntando a `app/**` y `components/**`.
- Estado: lints sin errores; formularios funcionales con shadcn/ui.

---

### Cambios recientes adicionales (resumen simple)

- Redirecciones más claras tras autenticación:
  - Login/Registro ahora redirigen a `/dashboard` (antes `/(app)`).
  - El botón “Cerrar sesión” redirige inmediatamente a `/login` y limpia la cookie.
- Cookies seteadas correctamente desde Route Handlers:
  - Se usa `NextResponse.json(...).cookies.set(...)` para asegurar que el `auth_token` se persista.
- Middleware más permisivo con recursos internos:
  - Se marcan públicas las rutas que empiezan con `/_next` además de `/api`, evitando redirecciones erróneas.
- Enlaces y rutas visibles para evitar 404 al navegar:
  - Enlaces en auth: `/login` ↔ `/register` (sin segmentos de carpeta del App Router en la URL).
  - Logo del sidebar apunta a `/dashboard`.
  - Páginas placeholder creadas: `/dashboard`, `/planilla`, `/equipo/roles`, `/equipo/empleados`, `/mi/turnos`.


