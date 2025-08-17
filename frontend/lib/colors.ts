/**
 * Sistema de Colores - Vibe Calendar
 * Inspirado en herramientas modernas como Notion y Linear
 */

// Colores primarios
export const colors = {
  // Grises neutrales (base del sistema)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  
  // Azul primario (acciones principales)
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Verde (estados exitosos)
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Amarillo (advertencias)
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Rojo (errores y eliminación)
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Púrpura (roles especiales)
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
};

// Colores semánticos
export const semanticColors = {
  // Estados de turnos
  shift: {
    draft: colors.amber[100],
    confirmed: colors.green[100],
    cancelled: colors.red[100],
    conflict: colors.red[200],
  },
  
  // Estados de disponibilidad
  availability: {
    available: colors.green[500],
    busy: colors.red[500],
    partial: colors.amber[500],
  },
  
  // Roles (colores predefinidos)
  roles: [
    colors.blue[500],
    colors.green[500],
    colors.purple[500],
    colors.amber[500],
    colors.red[500],
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ],
};

// Utilidades para generar colores
export const colorUtils = {
  /**
   * Genera un color de rol basado en el ID o nombre
   */
  getRoleColor: (roleIdOrName: number | string): string => {
    if (typeof roleIdOrName === 'string') {
      // Generar hash simple del string para obtener un índice consistente
      let hash = 0;
      for (let i = 0; i < roleIdOrName.length; i++) {
        const char = roleIdOrName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a 32bit integer
      }
      return semanticColors.roles[Math.abs(hash) % semanticColors.roles.length];
    }
    return semanticColors.roles[roleIdOrName % semanticColors.roles.length];
  },
  
  /**
   * Convierte hex a rgba
   */
  hexToRgba: (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
  
  /**
   * Obtiene el color de contraste (blanco o negro) para un color dado
   */
  getContrastColor: (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  },
};

// Exportar funciones individuales para facilitar el uso
export const getRoleColor = colorUtils.getRoleColor;
export const hexToRgba = colorUtils.hexToRgba;
export const getContrastColor = colorUtils.getContrastColor;

// Exportar para uso en Tailwind
export const tailwindColors = {
  neutral: colors.neutral,
  primary: colors.blue,
  success: colors.green,
  warning: colors.amber,
  danger: colors.red,
  purple: colors.purple,
};