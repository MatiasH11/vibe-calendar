'use client';

import { Sidebar } from '@/components/navigation/Sidebar';

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600">
                Bienvenido a tu panel de control de Vibe Calendar
              </p>
            </div>

            {/* Contenido principal */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg 
                      className="w-8 h-8 text-blue-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                      />
                    </svg>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    ¡Has iniciado sesión exitosamente!
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    Tu dashboard está listo. Desde aquí podrás acceder a todas las funciones 
                    de Vibe Calendar cuando estén disponibles.
                  </p>
                  
                  <div className="text-sm text-gray-500">
                    Para cerrar sesión, utiliza el botón en la barra lateral.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
