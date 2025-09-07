'use client';

import { ViewContainer } from '../ViewContainer';
import { DashboardCard } from '../DashboardCard';
import { StatsCard } from '../StatsCard';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/transitions';
import { Calendar, Plus, Clock, Users, RotateCcw } from 'lucide-react';

const turnosHoy = [
  { hora: '06:00 - 14:00', turno: 'Mañana', empleados: 8, estado: 'completo' },
  { hora: '14:00 - 22:00', turno: 'Tarde', empleados: 6, estado: 'incompleto' },
  { hora: '22:00 - 06:00', turno: 'Noche', empleados: 4, estado: 'completo' },
];

export function TurnosView() {
  return (
    <ViewContainer 
      title="Turnos" 
      subtitle="Gestión y planificación de turnos de trabajo"
      headerActions={
        <div className="flex space-x-2">
          <Button variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Auto-generar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Turno
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FadeIn delay={0.1}>
            <StatsCard
              title="Turnos Hoy"
              value="3"
              change="Todos cubiertos"
              trend="up"
              icon={Calendar}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <StatsCard
              title="Empleados Activos"
              value="18"
              change="75% capacidad"
              trend="neutral"
              icon={Users}
              color="text-green-600"
              bgColor="bg-green-50"
            />
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <StatsCard
              title="Horas Programadas"
              value="144h"
              change="Esta semana"
              trend="neutral"
              icon={Clock}
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
          </FadeIn>
          
          <FadeIn delay={0.4}>
            <StatsCard
              title="Turnos Pendientes"
              value="1"
              change="Requiere atención"
              trend="down"
              icon={RotateCcw}
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
          </FadeIn>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Turnos de Hoy */}
          <FadeIn delay={0.5}>
            <DashboardCard
              title="Turnos de Hoy"
              subtitle="Estado actual de los turnos programados"
              icon={Calendar}
            >
              <div className="space-y-4">
                {turnosHoy.map((turno, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{turno.turno}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        turno.estado === 'completo' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {turno.estado === 'completo' ? 'Completo' : 'Incompleto'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{turno.hora}</p>
                    <p className="text-sm text-gray-600">{turno.empleados} empleados asignados</p>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </FadeIn>

          {/* Calendario Semanal */}
          <FadeIn delay={0.6}>
            <DashboardCard
              title="Vista Semanal"
              subtitle="Planificación de la semana actual"
              icon={Calendar}
            >
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                  <div key={day} className="p-2 text-xs font-medium text-gray-600">
                    {day}
                  </div>
                ))}
                
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="p-2 border border-gray-200 rounded min-h-[80px]">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {i + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-blue-200 rounded"></div>
                      <div className="w-full h-2 bg-green-200 rounded"></div>
                      <div className="w-full h-2 bg-purple-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </FadeIn>
        </div>

        {/* Acciones Adicionales */}
        <FadeIn delay={0.7}>
          <DashboardCard
            title="Herramientas de Planificación"
            icon={RotateCcw}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <RotateCcw className="w-6 h-6 mb-2" />
                <span>Auto-generar Turnos</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Calendar className="w-6 h-6 mb-2" />
                <span>Planificar Semana</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Users className="w-6 h-6 mb-2" />
                <span>Asignar Empleados</span>
              </Button>
            </div>
          </DashboardCard>
        </FadeIn>
      </div>
    </ViewContainer>
  );
}
