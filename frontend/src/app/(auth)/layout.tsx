import { APP_NAME } from '@/lib/constants';
import { AuthRedirect } from '@/components/auth/AuthRedirect';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthRedirect>
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Panel izquierdo - Branding */}
        <div className="lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 p-8 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
            <div className="absolute top-1/3 right-0 w-32 h-32 bg-white rounded-full translate-x-16"></div>
            <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white rounded-full translate-y-12"></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center items-center text-center lg:text-left lg:items-start">
            <div className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {APP_NAME}
              </h1>
              <p className="text-xl text-blue-100 mb-6 leading-relaxed">
                Gestiona los turnos de tu equipo de manera eficiente y moderna
              </p>
            </div>
            
            <div className="space-y-6 text-blue-100">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-300 to-white rounded-full"></div>
                <span className="text-lg">Planificación automática de turnos</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-300 to-white rounded-full"></div>
                <span className="text-lg">Gestión completa de empleados</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-300 to-white rounded-full"></div>
                <span className="text-lg">Reportes y estadísticas detalladas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </AuthRedirect>
  );
}
