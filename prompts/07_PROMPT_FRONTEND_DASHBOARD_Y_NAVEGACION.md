### **Archivo 8: `07_PROMPT_FRONTEND_DASHBOARD_Y_NAVEGACION.md`**

**Propósito:** Implementar el layout autenticado del área de aplicación con navegación principal en barra lateral vertical, estado básico de usuario y flujo de logout, usando Next.js App Router, shadcn/ui, `sonner`, cookies HttpOnly y Route Handlers como proxy al backend.

```markdown
# Prompt: Frontend - Dashboard y Navegación (Layout Autenticado)

Actúa como Frontend Lead. Implementa el layout principal autenticado con navegación a secciones clave y estado de usuario visible. Usa Next.js App Router, shadcn/ui, `sonner`, cookies HttpOnly y Route Handlers como proxy al backend.

## Objetivo
- Layout autenticado `/(app)` con Sidebar vertical (izquierda) + Topbar responsive.
- Navegación a: `/dashboard`, `/planilla`, `/equipo/roles`, `/equipo/empleados`, `/mi/turnos`.
- Mostrar nombre/rol del usuario (si disponible) y proveer logout.

## Instrucciones Detalladas

### 1) Estructura de Carpetas
app/
  (app)/
    layout.tsx
    dashboard/page.tsx
    dashboard/loading.tsx        # opcional: skeleton para dashboard
    error.tsx                    # opcional: error boundary del segmento (app)
components/
  navigation/
    Sidebar.tsx
    Topbar.tsx
    UserMenu.tsx
    NavLink.tsx
    MobileNav.tsx         # usa Sheet de shadcn para menú móvil
  ui/                     # componentes shadcn/ui creados en 06
providers/
  QueryProvider.tsx
  AppProviders.tsx      # Wrapper de todos los providers
lib/
  auth.ts                 # getSession(cookies) definido en 06
  routes.ts               # mapa de rutas y etiquetas centralizado
styles/
  globals.css

### 1.1) Rutas centralizadas
- Define constantes de rutas y elementos de navegación para evitar strings mágicos y facilitar i18n en el futuro.

```ts
// lib/routes.ts
export const ROUTES = {
  DASHBOARD: '/dashboard',
  PLANILLA: '/planilla',
  EQUIPO_ROLES: '/equipo/roles',
  EQUIPO_EMPLEADOS: '/equipo/empleados',
  MI_TURNOS: '/mi/turnos',
} as const;

export const NAV_ITEMS = [
  { href: ROUTES.DASHBOARD, label: 'Dashboard', icon: 'Home' },
  { href: ROUTES.PLANILLA, label: 'Planilla', icon: 'Calendar' },
  { href: ROUTES.EQUIPO_ROLES, label: 'Roles', icon: 'Shield' },
  { href: ROUTES.EQUIPO_EMPLEADOS, label: 'Empleados', icon: 'Users' },
  { href: ROUTES.MI_TURNOS, label: 'Mi semana', icon: 'Clock' },
] as const;
```

### 2) Layout Autenticado
- `app/(app)/layout.tsx` (Server Component):
  - Obtiene sesión con `getSession(cookies)` para mostrar datos no sensibles (e.g., `first_name`, `role_name` si están disponibles en claims decodificadas del JWT).
  - Renderiza diseño de dos áreas con barra lateral vertical:
    - `Sidebar` vertical a la izquierda (persistente en desktop, colapsable en móvil) con navegación.
    - `Topbar` horizontal en el área de contenido con título/acciones y `UserMenu` (logout).
    - `{children}` para el contenido de cada página, desplazable de forma independiente a la `Sidebar`.
  - Monta `<Toaster />` de `sonner` para notificaciones globales.
  - Envolver `{children}` con `<AppProviders>` que incluya React Query y otros providers necesarios.
- Seguridad:
  - El acceso a `/(app)` ya está protegido por `middleware.ts` de 06 (revisa cookie `auth_token`).

#### 2.1) Diseño y responsividad (barra lateral vertical)
- La `Sidebar` debe ser una barra vertical fija a la izquierda en pantallas `md+`, con ancho entre 240–280px (sugerido `w-64`).
- En móvil (`< md`), la `Sidebar` se oculta y se presenta mediante `MobileNav` usando `Sheet` (deslizante desde la izquierda).
- La `Sidebar` debe ser `sticky` (o `fixed`) y permitir scroll independiente del área de contenido cuando la lista de enlaces exceda la altura.
- El área de contenido debe usar `min-h-screen` y padding adecuado; evitar que la `Topbar` o el contenido desplacen la `Sidebar`.

### 3) Componentes de Navegación
- `components/navigation/NavLink.tsx`:
  - Enlace que resalta activo comparando `usePathname()` con `href`.
- `components/navigation/Sidebar.tsx`:
  - Barra lateral vertical izquierda con lista de enlaces e íconos (lucide-react):
    - Dashboard → `/dashboard`
    - Planilla → `/planilla`
    - Roles → `/equipo/roles`
    - Empleados → `/equipo/empleados`
    - Mi semana → `/mi/turnos`
  - Estado “activo” visible y accesible.
  - TODO (futuro): filtrar items según permisos del rol del usuario.
- `components/navigation/MobileNav.tsx`:
  - Usa `Sheet` de shadcn/ui para abrir/cerrar el menú en pantallas pequeñas.
- `components/navigation/Topbar.tsx`:
  - Muestra título de sección (breadcrumbs/título dinámico basado en ruta actual).
  - Botón para abrir `MobileNav` en móvil.
  - `UserMenu` a la derecha.

```ts
// components/navigation/Topbar.tsx (idea)
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

const TITLE_MAP: Record<string, string> = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.PLANILLA]: 'Planilla de Turnos',
  [ROUTES.EQUIPO_ROLES]: 'Gestión de Roles',
  [ROUTES.EQUIPO_EMPLEADOS]: 'Gestión de Empleados',
  [ROUTES.MI_TURNOS]: 'Mis Turnos',
};

// en el componente
const pathname = usePathname();
const title = TITLE_MAP[pathname] ?? 'Panel';
```
- `components/navigation/UserMenu.tsx`:
  - Muestra nombre/rol (si disponible) usando la info que expone `getSession`.
  - Opción “Cerrar sesión” que hace `POST /api/auth/logout` y redirige a `/(auth)/login`.

### 4) Página de Dashboard
- `app/(app)/dashboard/page.tsx`:
  - Placeholder con bienvenida (ej.: “Hola, {first_name}”).
  - Opcional: tarjetas/KPIs stub (sin datos reales todavía).

### 5) Integración con shadcn/ui y UX
- Usa componentes de shadcn/ui: `button`, `dropdown-menu`, `sheet`, `dialog` (si fuera necesario).
- Íconos con `lucide-react`.
- Accesibilidad:
  - Roles ARIA en navegación.
  - Foco gestionado en `MobileNav`.
  - Estados de “activo” también accesibles (aria-current), y contraste adecuado.

### 5.1) Estados de UI
- Logout: mostrar estado de carga en el botón mientras se ejecuta `POST /api/auth/logout` (deshabilitar botón y feedback visual).
- Sesión: skeleton básico en cabecera (Topbar/User) si en futuras iteraciones se hidratan datos del usuario en cliente.
- Error boundaries: incluir `error.tsx` a nivel de segmento para manejar fallos de navegación/renderizado y ofrecer acción de reintento.

### 6) Red y Seguridad
- No exponer `API_BASE_URL` al cliente; no hacer llamadas directas desde el navegador al backend.
- Logout:
  - `POST /api/auth/logout` (Route Handler de 06) limpia la cookie `auth_token` (mismos flags de seguridad) y retorna 204 o `{ success: true }`.
  - Tras éxito, redirigir a `/(auth)/login`.

## Salida Esperada
- `app/(app)/layout.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/dashboard/loading.tsx` (opcional)
- `app/(app)/error.tsx` (opcional)
- `components/navigation/Sidebar.tsx`
- `components/navigation/Topbar.tsx`
- `components/navigation/UserMenu.tsx`
- `components/navigation/NavLink.tsx`
- `components/navigation/MobileNav.tsx`
- `lib/routes.ts`
```


