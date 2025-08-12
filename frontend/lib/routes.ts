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
];


