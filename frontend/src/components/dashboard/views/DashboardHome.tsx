'use client';

import { ViewContainer } from '../ViewContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/transitions';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';

const statsCards = [
  {
    title: 'Empleados Activos',
    value: '24',
    change: '+2 este mes',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Turnos Programados',
    value: '156',
    change: '+12 esta semana',
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Horas Totales',
    value: '1,248',
    change: '+5.2% vs mes anterior',
    icon: Clock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Eficiencia',
    value: '94.2%',
    change: '+1.8% mejora',
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

export function DashboardHome() {
  return (
    <ViewContainer 
      title="Dashboard" 
      subtitle="Resumen general de tu sistema de turnos"
    >
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <FadeIn key={stat.title} delay={0.1 + index * 0.1}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actividad Reciente */}
          <FadeIn delay={0.5}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-gray-600" />
                  <span>Actividad Reciente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    'Juan Pérez fue asignado al turno de mañana',
                    'Se creó nuevo turno para el departamento de ventas',
                    'María González completó su turno de 8 horas',
                    'Se generó reporte mensual de asistencia',
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{activity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Alertas y Notificaciones */}
          <FadeIn delay={0.6}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span>Alertas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Turno sin cubrir
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      El turno de noche del viernes necesita asignación
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Horas extra disponibles
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      3 empleados disponibles para horas extra esta semana
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Meta mensual alcanzada
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Se cumplió el 100% de cobertura de turnos este mes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </ViewContainer>
  );
}
