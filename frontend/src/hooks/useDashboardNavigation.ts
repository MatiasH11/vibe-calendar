'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useDashboard } from '@/components/dashboard/DashboardProvider';
import { useEffect } from 'react';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  breadcrumbs: string[];
}

const navigationMap: Record<string, NavigationItem> = {
  '/dashboard': {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    breadcrumbs: ['Dashboard'],
  },
  '/dashboard/administracion': {
    id: 'administracion',
    label: 'Administration',
    href: '/dashboard/administracion',
    breadcrumbs: ['Dashboard', 'Administration'],
  },
  '/dashboard/empleados': {
    id: 'empleados',
    label: 'Empleados',
    href: '/dashboard/empleados',
    breadcrumbs: ['Dashboard', 'Empleados'],
  },
  '/dashboard/turnos': {
    id: 'turnos',
    label: 'Turnos',
    href: '/dashboard/turnos',
    breadcrumbs: ['Dashboard', 'Turnos'],
  },
  '/dashboard/reportes': {
    id: 'reportes',
    label: 'Reportes',
    href: '/dashboard/reportes',
    breadcrumbs: ['Dashboard', 'Reportes'],
  },
  '/dashboard/configuracion': {
    id: 'configuracion',
    label: 'Configuración',
    href: '/dashboard/configuracion',
    breadcrumbs: ['Dashboard', 'Configuración'],
  },
};

export function useDashboardNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { setCurrentView, setBreadcrumbs, isMobile, setSidebarOpen } = useDashboard();

  // Actualizar vista actual basado en la ruta
  useEffect(() => {
    const currentNav = navigationMap[pathname];
    if (currentNav) {
      setCurrentView(currentNav.id);
      setBreadcrumbs(currentNav.breadcrumbs);
    }
  }, [pathname, setCurrentView, setBreadcrumbs]);

  const navigateTo = (href: string) => {
    const navItem = navigationMap[href];
    if (navItem) {
      setCurrentView(navItem.id);
      setBreadcrumbs(navItem.breadcrumbs);
      router.push(href);
      
      // Cerrar sidebar en móvil después de navegar
      if (isMobile) {
        setSidebarOpen(false);
      }
    }
  };

  const getCurrentNavigation = () => {
    return navigationMap[pathname] || navigationMap['/dashboard'];
  };

  return {
    navigateTo,
    getCurrentNavigation,
    navigationMap,
    currentPath: pathname,
  };
}
