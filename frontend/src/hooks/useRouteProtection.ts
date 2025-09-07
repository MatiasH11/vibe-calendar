import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from './usePermissions';
import { useAuth } from './useAuth';

interface RouteProtectionOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireEmployee?: boolean;
  redirectTo?: string;
}

export function useRouteProtection(options: RouteProtectionOptions = {}) {
  const { 
    requireAuth = true, 
    requireAdmin = false, 
    requireEmployee = false,
    redirectTo = '/login'
  } = options;
  
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdmin, isEmployee } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Esperar a que termine la carga

    // Verificar autenticación
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Verificar permisos de admin
    if (requireAdmin && !isAdmin) {
      router.push('/unauthorized');
      return;
    }

    // Verificar permisos de empleado
    if (requireEmployee && !isEmployee) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, isAdmin, isEmployee, isLoading, requireAuth, requireAdmin, requireEmployee, redirectTo, router]);

  return {
    isAuthenticated,
    isAdmin,
    isEmployee,
    isLoading,
    canAccess: isAuthenticated && (!requireAdmin || isAdmin) && (!requireEmployee || isEmployee),
  };
}
