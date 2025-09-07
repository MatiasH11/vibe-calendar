export const APP_NAME = 'Vibe Calendar';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
} as const;

export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export const EMPLOYEE_STATUS_LABELS = {
  [EMPLOYEE_STATUS.ACTIVE]: 'Activo',
  [EMPLOYEE_STATUS.INACTIVE]: 'Inactivo',
} as const;

export const EMPLOYEE_STATUS_COLORS = {
  [EMPLOYEE_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [EMPLOYEE_STATUS.INACTIVE]: 'bg-red-100 text-red-800',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const LAYOUT_CONFIG = {
  SIDEBAR_WIDTH: 320, // 80 * 4 = 320px (w-80)
  SIDEBAR_COLLAPSED_WIDTH: 0,
  MAIN_PANEL_MIN_WIDTH: 600,
  MOBILE_BREAKPOINT: 768,
} as const;

export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  SEARCH_DEBOUNCE: 500,
  STATS_UPDATE_INTERVAL: 30000, // 30 segundos
} as const;

export const EMPLOYEE_ACTIONS = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  TOGGLE_STATUS: 'toggle_status',
  FILTER_BY_ROLE: 'filter_by_role',
} as const;

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

// Colores para roles de negocio
export const ROLE_COLORS = {
  'Admin': 'bg-blue-500',
  'Vendedor': 'bg-green-500',
  'Gerente': 'bg-purple-500',
  'Recepcionista': 'bg-orange-500',
  'default': 'bg-gray-500',
} as const;

// Colores para tipos de usuario (permisos)
export const USER_TYPE_COLORS = {
  admin: 'bg-red-500',
  employee: 'bg-blue-500',
} as const;

// Iconos para roles de negocio
export const ROLE_ICONS = {
  'Admin': '👑',
  'Vendedor': '🛒',
  'Gerente': '👔',
  'Recepcionista': '📞',
  'default': '👤',
} as const;

// Iconos para tipos de usuario
export const USER_TYPE_ICONS = {
  admin: '🔑',
  employee: '👤',
} as const;