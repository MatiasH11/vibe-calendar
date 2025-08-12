### **Archivo 9: `08_PROMPT_FRONTEND_PLANILLA_SEMANAL_INTERACTIVA.md`**

**Propósito:** Construir la página y componentes de la Planilla Semanal interactiva (Lun–Dom), integrada al backend de turnos y empleados vía Route Handlers con cookie HttpOnly, usando Next.js App Router, Tailwind y shadcn/ui.

# Prompt: Frontend - Planilla Semanal Interactiva (Next.js, Tailwind, shadcn/ui)

Actúa como Frontend Lead. Implementa la grilla semanal de turnos con creación/edición/eliminación desde la UI, proxy seguro al backend y normalización de formatos de fecha/hora.

## Objetivo
- Página `/planilla` dentro de `/(app)` con:
  - Cabecera con días de la semana, filas por empleado.
  - Crear turno clicando en celda vacía.
  - Editar/eliminar turno existente.
  - Navegar semanas (anterior, siguiente, hoy).
- Integración robusta con backend:
  - Route Handlers (server) que adjuntan `Authorization: Bearer <token>` desde cookie `auth_token`.
  - Normalizan `shift_date` a `YYYY-MM-DD` y `start_time`/`end_time` a `HH:mm`.

## Requisitos Técnicos
- Next.js App Router con separación Server/Client Components.
- UI con Tailwind + componentes `shadcn/ui` (+ `sonner` para toasts).
- `date-fns` para manipular semanas y formatos.
- Mantener snake_case en DTOs con el backend.

## Gestión de Estado
- `@tanstack/react-query` para cache y sincronización de datos del servidor:
  - Cache de empleados con `useQuery(['employees'])`
  - Cache de turnos por semana con `useQuery(['shifts', startDate, endDate])`
  - Mutaciones optimistas para crear/editar/eliminar turnos (invalidar `['shifts', startDate, endDate]`)
- `zustand` para estado local del UI:
  - Semana seleccionada
  - Empleado/celda en edición
  - Estados de loading/error locales
- Hooks customizados:
  - `useShifts(startDate, endDate)` - manejo completo de turnos
  - `useShiftMutations({ startDate, endDate })` - CRUD con optimistic updates
  - `useWeekNavigation()` - navegación entre semanas

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

### app/api/employees/route.ts (GET)
- Proxy a `GET ${API_BASE_URL}/api/v1/employees`.
- Devuelve `StandardResponse<Employee[]>`.

### app/api/shifts/route.ts
- GET: acepta `start_date`, `end_date` (strings `YYYY-MM-DD`).
- POST: body `{ company_employee_id: number; shift_date: string; start_time: string; end_time: string; notes?: string }`.
- Normalizar tiempos en la respuesta a `HH:mm`.
- Manejar y propagar errores (`SHIFT_OVERLAP`, `OVERNIGHT_NOT_ALLOWED`, `UNAUTHORIZED_COMPANY_ACCESS`) con sus códigos.

### app/api/shifts/[id]/route.ts
- PUT: body parcial `{ shift_date?: string; start_time?: string; end_time?: string; notes?: string }`
- DELETE: sin body.

## Página `/(app)/planilla/page.tsx` (Server Component)
- Determinar semana base (por defecto, actual) vía `searchParams` opcional `?w=YYYY-Www`.
- Calcular `start_date` y `end_date`.
- Hacer fetch server-side a:
  - `GET /app/api/employees`
  - `GET /app/api/shifts?start_date&end_date`
- Pasar a `WeeklyGrid` (Client) los arrays serializados y el rango de fechas.

## Componentes
### WeeklyGrid.tsx (Client)
- Props: `employees: Employee[]`, `shifts: Shift[]`, `start_date: string` (lunes), `end_date: string` (domingo).
- Estado:
  - Semana actual (para navegación).
  - Dataset de `shifts` (puede refrescarse tras mutaciones).
- Render:
  - Cabecera con los 7 días.
  - Filas por empleado (`EmployeeRow`).
- Acciones:
  - Botones “Semana anterior”, “Hoy”, “Siguiente semana”.
  - Handlers `onCreateShift`, `onUpdateShift`, `onDeleteShift` que llaman a los route handlers correspondientes y refrescan datos.
- UX:
  - Toasts con `sonner` para success/error.
  - Loading states en acciones.

### EmployeeRow.tsx
- Props: `employee: Employee`, `days: string[]`, `shifts: Shift[]`, callbacks de CRUD.
- Mapea `shifts` del empleado por día; para cada celda:
  - Si vacío: click abre `ShiftEditorDialog` (modo crear).
  - Si hay turno: renderiza `ShiftItem` con click para editar.

### ShiftItem.tsx
- Muestra `start_time–end_time`, `notes` abreviado.
- OnClick → abrir `ShiftEditorDialog` (modo editar) con opción eliminar.

### ShiftEditorDialog.tsx
- Formulario con `react-hook-form` + Zod validation:
  - `shift_date` prellenado (celda clickeada).
  - `start_time`, `end_time` con patrón `HH:mm`.
  - `notes` opcional.
- Botones Guardar/Cancelar; mientras guarda, disabled.
- En editar, botón Eliminar con confirmación.

## Validaciones en Cliente (suaves)
- Enviar siempre en `HH:mm` y `YYYY-MM-DD`.
- Prevenir claramente `end_time <= start_time` (mostrar mensaje antes de enviar).
- Recordatorio: el backend es la autoridad final (puede devolver `SHIFT_OVERLAP`).

## Errores y Mensajes
- `SHIFT_OVERLAP` → “El turno se solapa con otro existente para este empleado en la misma fecha.”
- `OVERNIGHT_NOT_ALLOWED` → “No se permiten turnos que crucen medianoche.”
- `UNAUTHORIZED`/`FORBIDDEN` → “Tu sesión expiró o no tienes permisos.”
- Mostrar mensajes backend `error.message` si existen.

## Seguridad y Red
- Nunca exponer `API_BASE_URL` en el cliente.
- Todas las llamadas desde componentes van a `/app/api/...` (Route Handlers server).
- Cookies HttpOnly para token; `middleware.ts` ya protege `/(app)`.

## Accesibilidad y Responsividad
- Cabecera sticky, columna de empleados legible en móvil (scroll horizontal).
- Diálogo accesible (focus trap, `aria-*`).

## Salida Esperada
- `app/(app)/planilla/page.tsx`
- `components/planilla/WeeklyGrid.tsx`
- `components/planilla/EmployeeRow.tsx`
- `components/planilla/ShiftItem.tsx`
- `components/planilla/ShiftEditorDialog.tsx`
- `app/api/employees/route.ts`
- `app/api/shifts/route.ts`
- `app/api/shifts/[id]/route.ts`
- `lib/date.ts`
- `lib/types.ts`

## Notas
- Usar `sonner` para feedback.
- Mantener snake_case en JSON hacia/desde backend.
- Devolver `StandardResponse<T>` desde Route Handlers.


