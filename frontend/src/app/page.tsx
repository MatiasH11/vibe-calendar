import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6">
            {APP_NAME}
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            La solución completa para gestionar los turnos de trabajo de tu equipo.
            Simplifica la planificación, optimiza la productividad y mejora la comunicación.
          </p>
          <div className="space-x-4">
            <Link href="/register">
              <Button size="lg" className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                Comenzar Gratis
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-md bg-white/80 backdrop-blur">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <CardTitle className="text-xl font-bold text-gray-800">Planificación Inteligente</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Crea y gestiona turnos de manera automática considerando disponibilidad, preferencias y regulaciones laborales.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-md bg-white/80 backdrop-blur">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <CardTitle className="text-xl font-bold text-gray-800">Gestión de Equipos</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Administra empleados, roles y permisos desde una interfaz intuitiva y fácil de usar.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-md bg-white/80 backdrop-blur">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <CardTitle className="text-xl font-bold text-gray-800">Reportes Detallados</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Analiza productividad, asistencia y costos con reportes completos y visualizaciones claras.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Sección adicional de features */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-12">
            Todo lo que necesitas para gestionar turnos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-800">Rápido y Eficiente</h3>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold text-gray-800">Seguro y Confiable</h3>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-800">Diseño Responsive</h3>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🌟</span>
              </div>
              <h3 className="font-semibold text-gray-800">Fácil de Usar</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}