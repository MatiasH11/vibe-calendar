'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { FadeIn } from '@/components/ui/transitions';

export function TestView() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <FadeIn delay={0.1}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Vista de Pruebas
            </h1>
            <p className="text-gray-600 mt-2">Dashboard temporal para testing</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            Cerrar Sesión
          </Button>
        </div>
      </FadeIn>

      {/* Welcome Section */}
      <FadeIn delay={0.2}>
        <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">
              ¡Sistema de Layout Funcionando! 🎉
            </CardTitle>
            <CardDescription className="text-lg">
              El nuevo layout con sidebar está activo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">
                    <strong>Usuario ID:</strong> {user.user_id}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-700">
                    <strong>Email:</strong> No disponible
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span className="text-gray-700">
                    <strong>Empresa ID:</strong> {user.company_id || 'No disponible'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
