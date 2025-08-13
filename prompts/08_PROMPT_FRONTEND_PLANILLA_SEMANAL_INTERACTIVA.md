### **Archivo 9: `08_PROMPT_FRONTEND_PLANILLA_SEMANAL_INTERACTIVA.md`**

**Propósito:** Construir la página y componentes de la Planilla Semanal interactiva (Lun–Dom), integrada al backend de turnos y empleados vía Route Handlers con cookie HttpOnly, usando Next.js App Router, Tailwind y shadcn/ui.

# Prompt: Frontend - Planilla Semanal Interactiva (Next.js, Tailwind, shadcn/ui)

Actúa como Frontend Lead. Implementa la grilla semanal de turnos con creación/edición/eliminación desde la UI, proxy seguro al backend y normalización de formatos de fecha/hora. Debe funcionar con datos reales y manejar estados vacíos.

## Pre-requisitos de datos (desarrollo)
- Opción A (recomendada): ejecutar un seed en backend para crear 1–2 `roles`, 2–3 `employees` y 3–6 `shifts` en la semana actual.
- Opción B: continuar sin seed y verificar “empty states” (sin empleados/turnos) en la UI.
- Mantener `shift_date` en `YYYY-MM-DD` y `start_time`/`end_time` en `HH:mm`.

## Objetivo
- Página `/planilla` dentro de `/(app)` con:
  - Cabecera con días de la semana, filas por empleado.
  - Crear turno clicando en celda vacía.
  - Editar/eliminar turno existente.
  - Navegar semanas (anterior, siguiente, hoy) y sincronizar con la URL.
- Integración robusta con backend:
  - Route Handlers (server) que adjuntan `Authorization: Bearer <token>` desde cookie `auth_token`.
  - Normalizan `shift_date` a `YYYY-MM-DD` y `start_time`/`end_time` a `HH:mm`.

## Requisitos Técnicos
- Next.js App Router con separación Server/Client Components.
- UI con Tailwind + componentes `shadcn/ui` (+ `sonner` para toasts).
- `date-fns` para manipular semanas y formatos.
- Mantener snake_case en DTOs con el backend.
- SSR opcional para datos iniciales; usar React Query en cliente para refrescos y mutaciones.

## Gestión de Estado
- `@tanstack/react-query` para cache y sincronización de datos del servidor:
  - Cache de empleados (SSR o `useQuery(['employees'])`).
  - Cache de turnos por semana con `useQuery(['shifts', startDate, endDate])`.
  - Mutaciones optimistas para crear/editar/eliminar turnos (invalidar `['shifts', startDate, endDate]`).
- `zustand` para estado local del UI (opcional):
  - Semana seleccionada (si no se usa solo el hook `useWeekNavigation`).
  - Empleado/celda en edición.
  - Estados de loading/error locales.
- Hooks customizados:
  - `useShifts(startDate, endDate)` - manejo completo de turnos.
  - `useShiftMutations({ startDate, endDate })` - CRUD con optimistic updates e invalidación.
  - `useWeekNavigation()` - navegación entre semanas.

## Estructura (añadir a lo ya creado en 06 y 07)
```
app/
  (app)/
    planilla/
      page.tsx
app/api/
  employees/route.ts        # GET
  shifts/route.ts           # GET, POST
  shifts/[id]/route.ts      # PUT, DELETE
components/
  planilla/
    WeeklyGrid.tsx
    EmployeeRow.tsx
    ShiftItem.tsx
    ShiftEditorDialog.tsx
hooks/
  useShifts.ts
  useShiftMutations.ts
  useWeekNavigation.ts
stores/
  planillaStore.ts
providers/
  QueryProvider.tsx
lib/
  date.ts
  types.ts                  # tipos Shift, Employee, StandardResponse
  api.ts                    # (si no existe) helpers cliente→route handlers
```

## Tipos (lib/types.ts)
- `export type Employee = { id: number; user: { first_name: string; last_name: string; email: string }; role: { id: number; name: string } }`
- `export type Shift = { id: number; company_employee_id: number; shift_date: string; start_time: string; end_time: string; notes?: string; status?: 'draft'|'confirmed'|'cancelled' }`
- `export type StandardResponse<T> = { success: boolean; data?: T; error?: { error_code: string; message: string; details?: unknown }; meta?: unknown }`

## Utilidades (lib/date.ts)
- `getWeekRange(baseDate: Date, weekStartsOn = 1)` → `{ start: Date, end: Date }`
- `formatYmd(d: Date): string` → `YYYY-MM-DD`
- `formatHm(dateOrString: Date|string): string` → `HH:mm`
- `eachDayOfWeek(start: Date): Date[]` (7 elementos)

## Route Handlers (proxy)
- Todas las rutas deben:
  - Leer `auth_token` de `cookies()`.
  - Usar `API_BASE_URL` del entorno (solo server).
  - Adjuntar `Authorization: Bearer`.
  - Normalizar formatos de respuesta para `Shift`:
    - `shift_date` → `YYYY-MM-DD`
    - `start_time`/`end_time` → `HH:mm`
- Manejar y propagar errores (`SHIFT_OVERLAP`, `OVERNIGHT_NOT_ALLOWED`, `UNAUTHORIZED_COMPANY_ACCESS`) con sus códigos.

### app/api/employees/route.ts (GET)
- Proxy a `GET ${API_BASE_URL}/api/v1/employees`.
- Devuelve `StandardResponse<Employee[]>`.

### app/api/shifts/route.ts
- GET: acepta `start_date`, `end_date` (strings `YYYY-MM-DD`).
- POST: body `{ company_employee_id: number; shift_date: string; start_time: string; end_time: string; notes?: string }`.
- Normalizar tiempos en la respuesta a `HH:mm`.

### app/api/shifts/[id]/route.ts
- PUT: body parcial `{ shift_date?: string; start_time?: string; end_time?: string; notes?: string }`
- DELETE: sin body.

## Página `/(app)/planilla/page.tsx` (Server Component)
- Determinar semana base vía `searchParams`:
  - Preferido: `?w=YYYY-Www` (ISO week).
  - Alternativa: `?start_date=YYYY-MM-DD` (lunes).
- Calcular `start_date` y `end_date`.
- Fetch server-side a:
  - `GET /app/api/employees`
  - `GET /app/api/shifts?start_date&end_date` (opcional, para `initialData`).
- Pasar a `WeeklyGrid`:
  - `employees` (array serializado)
  - `start_date` (lunes de la semana)
  - `initial_shifts?` (opcional; usar como `initialData` de React Query)

## Componentes
### WeeklyGrid.tsx (Client)
- Props:
  - `employees: Employee[]`
  - `start_date: string` (lunes, `YYYY-MM-DD`)
  - `initial_shifts?: Shift[]` (opcional)
- Estado/Hook:
  - `useWeekNavigation()` para obtener `startDate`, `endDate` y acciones `goPrev`, `goNext`, `goToday` (inicializar con `start_date`).
  - `useShifts(startDate, endDate)` para cargar turnos (usar `initial_shifts` como `initialData` si se provee).
- Render:
  - Cabecera con los 7 días.
  - Barra de acciones con botones “Semana anterior”, “Hoy”, “Siguiente semana”.
  - Filas por empleado (`EmployeeRow`).
- Navegación/URL:
  - Al cambiar de semana, actualizar `?w=YYYY-Www` con `router.replace` para compartir estado.
- Empty states:
  - Si `employees.length === 0`: mostrar mensaje “No hay empleados aún” y deshabilitar acciones de turno.
  - Si hay empleados pero `shifts` vacío: mostrar “Añadir” en celdas.
- Loading/Error:
  - Mostrar indicador mientras carga `useShifts`.
  - En error, mostrar mensaje y botón reintentar.

### EmployeeRow.tsx
- Props: `employee: Employee`, `weekStart: string`, `shifts: Shift[]`, callbacks de CRUD.
- Mapea `shifts` del empleado por día; para cada celda:
  - Si vacío: click abre `ShiftEditorDialog` (modo crear).
  - Si hay turno: renderiza `ShiftItem` con click para editar.
- CRUD:
  - Usar `useShiftMutations({ startDate, endDate })` para crear/editar/eliminar.
  - Tras mutaciones, cerrar diálogo y mostrar toast.

### ShiftItem.tsx
- Muestra `start_time–end_time`, `notes` abreviado.
- OnClick → abrir `ShiftEditorDialog` (modo editar) con opción eliminar.

### ShiftEditorDialog.tsx
- Formulario con `react-hook-form` + Zod:
  - `shift_date` prellenado (read-only en UI).
  - `start_time`, `end_time` con patrón `HH:mm`, validación suave: `end_time > start_time` (mostrar mensaje si no).
  - `notes` opcional.
- Botones Guardar/Cancelar; mientras guarda, disabled.
- En editar, botón Eliminar con confirmación.
- Mensajería:
  - Mostrar toasts de éxito/error con `sonner`.

## Validaciones en Cliente (suaves)
- Enviar siempre `HH:mm` y `YYYY-MM-DD`.
- Prevenir `end_time <= start_time` (bloquear submit y mostrar mensaje).
- Recordatorio: el backend es la autoridad final (puede devolver `SHIFT_OVERLAP`).

## Errores y Mensajes
- `SHIFT_OVERLAP` → “El turno se solapa con otro existente para este empleado en la misma fecha.”
- `OVERNIGHT_NOT_ALLOWED` → “No se permiten turnos que crucen medianoche.”
- `UNAUTHORIZED`/`FORBIDDEN` → “Tu sesión expiró o no tienes permisos.”
- Mostrar mensajes backend `error.message` si existen.
- Mostrar `toast.success` en create/update/delete exitosos.

## Seguridad y Red
- Nunca exponer `API_BASE_URL` en el cliente.
- Todas las llamadas desde componentes van a `/app/api/...` (Route Handlers server).
- Cookies HttpOnly para token; `middleware.ts` ya protege `/(app)`.

## Accesibilidad y Responsividad
- Cabecera sticky, columna de empleados legible en móvil (scroll horizontal).
- Diálogo accesible (focus trap, `aria-*`).
- Click targets adecuados en celdas y items de turno.

## Estados Vacíos (Empty States)
- Sin empleados: mensaje guía para crear empleados (se realizará en fase 09).
- Con empleados y sin turnos: mostrar “Añadir” en celdas y ayuda contextual breve.

## Seed de Desarrollo (opcional)
- Ejecutar un seed local que cree:
  - 1–2 `roles`, 2–3 `employees` y 3–6 `shifts` en la semana actual.
- Debe ser idempotente y acotado a la empresa de desarrollo.

## Salida Esperada
- `app/(app)/planilla/page.tsx` (actualizar)
- `components/planilla/WeeklyGrid.tsx` (actualizar)
- `components/planilla/EmployeeRow.tsx` (actualizar)
- `components/planilla/ShiftItem.tsx` (usar desde `EmployeeRow`)
- `components/planilla/ShiftEditorDialog.tsx` (actualizar validaciones y UX)
- `app/api/employees/route.ts` (sin cambios o normalización menor)
- `app/api/shifts/route.ts` (sin cambios o normalización menor)
- `app/api/shifts/[id]/route.ts` (sin cambios)
- `lib/date.ts` (sin cambios)
- `lib/types.ts` (sin cambios)

## Criterios de Aceptación
- Navegación semanal funcional con sincronización en URL.
- La grilla usa `useShifts` y refleja cambios tras mutaciones sin recargar.
- Validación cliente activa y mensajes de backend propagados con toasts.
- Estados vacíos claros y sin errores de consola.


