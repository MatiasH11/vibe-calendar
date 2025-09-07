'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { UserType } from '@/types/auth';

interface ProtectedContentProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireEmployee?: boolean;
  fallback?: ReactNode;
  showUnauthorized?: boolean;
}

export function ProtectedContent({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireEmployee = false,
  fallback = null,
  showUnauthorized = false,
}: ProtectedContentProps) {
  const { isAuthenticated, isAdmin, isEmployee } = usePermissions();

  // Verificar autenticación
  if (requireAuth && !isAuthenticated) {
    return showUnauthorized ? (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">Debes iniciar sesión para acceder a este contenido</p>
      </div>
    ) : fallback;
  }

  // Verificar permisos de admin
  if (requireAdmin && !isAdmin) {
    return showUnauthorized ? (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">No tienes permisos de administrador</p>
        <p className="text-gray-500 mb-4">Solo los administradores pueden acceder a esta sección</p>
      </div>
    ) : fallback;
  }

  // Verificar permisos de empleado
  if (requireEmployee && !isEmployee) {
    return showUnauthorized ? (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">No tienes permisos de empleado</p>
      </div>
    ) : fallback;
  }

  return <>{children}</>;
}
