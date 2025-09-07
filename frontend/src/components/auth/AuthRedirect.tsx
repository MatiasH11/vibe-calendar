'use client';

import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/ui/loading';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function AuthRedirect({ 
  children, 
  redirectTo = '/dashboard',
  requireAuth = false 
}: AuthRedirectProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push('/login');
      } else if (!requireAuth && isAuthenticated) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  // Si requiere auth y no está autenticado, mostrar loading mientras redirige
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  // Si no requiere auth y está autenticado, mostrar loading mientras redirige
  if (!requireAuth && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
