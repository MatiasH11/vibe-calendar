'use client';

import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/useLogout';

export function Sidebar() {
  const { logout, isLoading } = useLogout();

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Header del sidebar */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">
          Vibe Calendar
        </h1>
      </div>

      {/* Contenido principal del sidebar */}
      <div className="flex-1 p-6">
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            ¡Bienvenido al dashboard!
          </div>
          
          {/* Aquí se pueden agregar más elementos de navegación en el futuro */}
          <div className="text-xs text-gray-400">
            Más funciones próximamente...
          </div>
        </div>
      </div>

      {/* Botón de logout en la parte inferior */}
      <div className="p-6 border-t border-gray-200">
        <Button 
          onClick={logout}
          disabled={isLoading}
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          {isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </Button>
      </div>
    </aside>
  );
}
