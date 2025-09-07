# 📦 FASE 1: Setup y Configuración para Vista de Turnos

## 🎯 Objetivo
Configurar dependencias específicas y estructura base para la vista de turnos semanal. **Solo configuración**, no implementación de componentes.

## 🔧 Comandos de Setup

```bash
# 1. Dependencias adicionales para vista de turnos
npm install date-fns@2.30.0 react-big-calendar@1.8.5 @types/react-big-calendar@1.8.0
npm install react-datepicker@4.25.0 @types/react-datepicker@4.19.4
npm install react-hotkeys-hook@4.4.1

# 2. Componentes shadcn/ui adicionales para turnos
npx shadcn-ui@0.8.0 add calendar popover tooltip
npx shadcn-ui@0.8.0 add dropdown-menu context-menu
npx shadcn-ui@0.8.0 add dialog sheet

# 3. Estructura de directorios para turnos (Windows)
mkdir components\shifts
mkdir components\shifts\grid
mkdir components\shifts\forms
mkdir components\shifts\modals
mkdir hooks\shifts
mkdir stores\shifts
mkdir types\shifts
```

## 📁 Estructura Creada

```
frontend/
├── components/
│   └── shifts/
│       ├── grid/           # Componentes de grilla semanal
│       ├── forms/          # Formularios de turnos
│       └── modals/         # Modales de gestión
├── hooks/
│   └── shifts/             # Hooks específicos de turnos
├── stores/
│   └── shifts/             # Estado global de turnos
└── types/
    └── shifts/             # Tipos específicos de turnos
```

## 🎨 Configuraciones Adicionales

### Actualizar `tailwind.config.ts` (colores para roles)
```typescript
// Agregar a la sección extend.colors
roleColors: {
  bar: {
    DEFAULT: 'hsl(262, 83%, 58%)',      // Púrpura
    foreground: 'hsl(0, 0%, 98%)',
    light: 'hsl(262, 83%, 95%)',
  },
  cocina: {
    DEFAULT: 'hsl(25, 95%, 53%)',       // Naranja
    foreground: 'hsl(0, 0%, 98%)',
    light: 'hsl(25, 95%, 95%)',
  },
  caja: {
    DEFAULT: 'hsl(142, 76%, 36%)',      // Verde
    foreground: 'hsl(0, 0%, 98%)',
    light: 'hsl(142, 76%, 95%)',
  },
  default: {
    DEFAULT: 'hsl(210, 40%, 50%)',      // Azul por defecto
    foreground: 'hsl(0, 0%, 98%)',
    light: 'hsl(210, 40%, 95%)',
  },
},
```

### `lib/dateUtils.ts` (utilidades de fecha)
```typescript
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date: Date, formatStr: string = 'dd/MM/yyyy') => {
  return format(date, formatStr, { locale: es });
};

export const formatTime = (date: Date) => {
  return format(date, 'HH:mm');
};

export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Lunes
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const getWeekRange = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
};

export const navigateWeek = (currentDate: Date, direction: 'prev' | 'next') => {
  return direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
};
```

### `lib/constants.ts` (constantes de turnos)
```typescript
export const SHIFT_CONSTANTS = {
  WEEK_DAYS: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  TIME_SLOTS: [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ],
  SHIFT_DURATION: 8, // horas por defecto
  MIN_SHIFT_DURATION: 1, // hora mínima
  MAX_SHIFT_DURATION: 12, // horas máximas
} as const;

export const ROLE_COLORS = {
  bar: 'roleColors-bar',
  cocina: 'roleColors-cocina', 
  caja: 'roleColors-caja',
  default: 'roleColors-default',
} as const;
```

## ✅ Validación

```bash
# Verificar dependencias instaladas
npm list date-fns react-big-calendar react-datepicker

# Verificar estructura (Windows)
dir components\shifts
dir hooks\shifts
dir stores\shifts
dir types\shifts

# Verificar compilación
npx tsc --noEmit
```

## 🎯 Resultado

- **Dependencias específicas** para gestión de turnos instaladas
- **Estructura de directorios** organizada para componentes de turnos
- **Utilidades de fecha** configuradas
- **Constantes** definidas para roles y horarios
- **Configuración Tailwind** extendida para colores de roles

**La base está lista** para crear componentes de vista de turnos.
