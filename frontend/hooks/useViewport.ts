'use client';

import { useState, useEffect } from 'react';

/**
 * Breakpoints del sistema de diseño
 * Basado en Tailwind CSS con nombres semánticos
 */
export const breakpoints = {
  xs: 320,   // Móviles pequeños
  sm: 640,   // Móviles
  md: 768,   // Tablets
  lg: 1024,  // Desktop pequeño
  xl: 1280,  // Desktop
  '2xl': 1536, // Desktop grande
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Información del viewport actual
 */
export interface ViewportInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
}

/**
 * Hook para obtener información del viewport y breakpoints
 * Incluye debounce para optimizar rendimiento
 */
export function useViewport(): ViewportInfo {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    // Valores por defecto para SSR
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        breakpoint: 'lg' as Breakpoint,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLandscape: true,
        isPortrait: false,
      };
    }

    return getViewportInfo();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce para evitar demasiadas actualizaciones
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport(getViewportInfo());
      }, 100);
    };

    // Actualizar inmediatamente al montar
    setViewport(getViewportInfo());

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return viewport;
}

/**
 * Obtiene la información actual del viewport
 */
function getViewportInfo(): ViewportInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const breakpoint = getCurrentBreakpoint(width);
  
  return {
    width,
    height,
    breakpoint,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isLandscape: width > height,
    isPortrait: height >= width,
  };
}

/**
 * Determina el breakpoint actual basado en el ancho
 */
function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

/**
 * Hook para verificar si estamos en un breakpoint específico o mayor
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const { width } = useViewport();
  return width >= breakpoints[breakpoint];
}

/**
 * Hook para verificar múltiples breakpoints
 */
export function useBreakpoints() {
  const { width } = useViewport();
  
  return {
    isXs: width >= breakpoints.xs && width < breakpoints.sm,
    isSm: width >= breakpoints.sm && width < breakpoints.md,
    isMd: width >= breakpoints.md && width < breakpoints.lg,
    isLg: width >= breakpoints.lg && width < breakpoints.xl,
    isXl: width >= breakpoints.xl && width < breakpoints['2xl'],
    is2Xl: width >= breakpoints['2xl'],
    
    // Helpers semánticos
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    
    // Breakpoints mínimos
    smUp: width >= breakpoints.sm,
    mdUp: width >= breakpoints.md,
    lgUp: width >= breakpoints.lg,
    xlUp: width >= breakpoints.xl,
    '2xlUp': width >= breakpoints['2xl'],
  };
}

/**
 * Hook para detectar cambios de orientación
 */
export function useOrientation() {
  const { isLandscape, isPortrait } = useViewport();
  
  return {
    isLandscape,
    isPortrait,
    orientation: isLandscape ? 'landscape' : 'portrait',
  };
}

/**
 * Utilidades para media queries en JavaScript
 */
export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs}px)`,
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
  
  // Rangos específicos
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`,
  
  // Orientación
  landscape: '(orientation: landscape)',
  portrait: '(orientation: portrait)',
  
  // Preferencias del usuario
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
};

/**
 * Hook para usar media queries directamente
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}