'use client';

import { ViewContainer } from '../ViewContainer';
import { DashboardCard } from '../DashboardCard';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/transitions';
import { BarChart3, Download, FileText, TrendingUp, Calendar, Clock } from 'lucide-react';

const reportesDisponibles = [
  {
    titulo: 'Reporte de Asistencia',
    descripcion: 'Análisis detallado de asistencia mensual',
    tipo: 'Mensual',
    icono: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    titulo: 'Horas Trabajadas',
    descripcion: 'Total de horas por empleado y departamento',
    tipo: 'Semanal',
    icono: Clock,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    titulo: 'Eficiencia de Turnos',
    descripcion: 'Análisis de cobertura y optimización',
    tipo: 'Mensual',
    icono: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    titulo: 'Costos Laborales',
    descripcion: 'Desglose de costos por período',
    tipo: 'Mensual',
    icono: BarChart3,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

export function ReportesView() {
  return (
    <ViewContainer 
      title="Reportes" 
      subtitle="Análisis y estadísticas del sistema de turnos"
      headerActions={
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar Todo
        </Button>
      }
    >
      <div className="p-6 space-y-6">
        {/* Resumen Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FadeIn delay={0.1}>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reportes Generados</p>
                  <p className="text-2xl font-bold text-gray-900">47</p>
                  <p className="text-sm text-green-600">+12 este mes</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Última Actualización</p>
                  <p className="text-lg font-bold text-gray-900">Hoy</p>
                  <p className="text-sm text-gray-500">9:30 AM</p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tendencia General</p>
                  <p className="text-lg font-bold text-gray-900">Positiva</p>
                  <p className="text-sm text-green-600">+5.2% mejora</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Próximo Reporte</p>
                  <p className="text-lg font-bold text-gray-900">2 días</p>
                  <p className="text-sm text-gray-500">Informe mensual</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Reportes Disponibles */}
        <FadeIn delay={0.5}>
          <DashboardCard
            title="Reportes Disponibles"
            subtitle="Genera y descarga reportes personalizados"
            icon={BarChart3}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reportesDisponibles.map((reporte, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${reporte.bgColor}`}>
                      <reporte.icono className={`w-6 h-6 ${reporte.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{reporte.titulo}</h4>
                      <p className="text-sm text-gray-600 mb-2">{reporte.descripcion}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {reporte.tipo}
                        </span>
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Generar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </FadeIn>

        {/* Gráfico de Ejemplo */}
        <FadeIn delay={0.6}>
          <DashboardCard
            title="Tendencias Recientes"
            subtitle="Resumen visual de los últimos 30 días"
            icon={TrendingUp}
          >
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Gráfico de tendencias</p>
                <p className="text-sm text-gray-500">Los gráficos se implementarán en una fase posterior</p>
              </div>
            </div>
          </DashboardCard>
        </FadeIn>
      </div>
    </ViewContainer>
  );
}
