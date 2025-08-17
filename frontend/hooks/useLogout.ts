'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes';

export function useLogout() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Sesión cerrada correctamente');
        router.push(ROUTES.LOGIN);
        router.refresh(); // Fuerza el refresh para limpiar cualquier cache
      } else {
        throw new Error('Error al cerrar sesión');
      }
    } catch (error) {
      console.error('Error durante logout:', error);
      toast.error('Error al cerrar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return { logout, isLoading };
}
