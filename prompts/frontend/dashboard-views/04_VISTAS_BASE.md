# 🖼️ FASE 4: Vistas Base del Dashboard

## 🎯 Objetivo
Implementar todas las vistas principales del dashboard con contenido base, componentes reutilizables, y estados de loading/error.

## 📄 PASO 1: Páginas de Rutas Adicionales

### Crear `src/app/(dashboard)/empleados/page.tsx`
```typescript
'use client';

import { EmpleadosView } from '@/components/dashboard/views/EmpleadosView';

export default function EmpleadosPage() {
  return <EmpleadosView />;
}
```

### Crear `src/app/(dashboard)/turnos/page.tsx`
```typescript
'use client';

import { TurnosView } from '@/components/dashboard/views/TurnosView';

export default function TurnosPage() {
  return <TurnosView />;
}
```

### Crear `src/app/(dashboard)/reportes/page.tsx`
```typescript
'use client';

import { ReportesView } from '@/components/dashboard/views/ReportesView';

export default function ReportesPage() {
  return <ReportesView />;
}
```

### Crear `src/app/(dashboard)/configuracion/page.tsx`
```typescript
'use client';

import { ConfiguracionView } from '@/components/dashboard/views/ConfiguracionView';

export default function ConfiguracionPage() {
  return <ConfiguracionView />;
}
```

## 🧱 PASO 2: Componentes Reutilizables

### Crear `src/components/dashboard/DashboardCard.tsx`
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  headerActions?: React.ReactNode;
}

export function DashboardCard({ 
  title, 
  subtitle, 
  children, 
  icon: Icon, 
  iconColor = "text-gray-600",
  className,
  headerActions
}: DashboardCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center space-x-2">
            {Icon && <Icon className={cn("w-5 h-5", iconColor)} />}
            <span>{title}</span>
          </CardTitle>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {headerActions && (
          <div className="flex items-center space-x-2">
            {headerActions}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
```

### Crear `src/components/dashboard/StatsCard.tsx`
```typescript
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral',
  icon: Icon, 
  color = "text-blue-600",
  bgColor = "bg-blue-50",
  className 
}: StatsCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {value}
            </p>
            {change && (
              <p className={cn("text-sm", trendColors[trend])}>
                {change}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", bgColor)}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Crear `src/components/dashboard/DataTable.tsx`
```typescript
'use client';

import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  className,
  emptyMessage = "No hay datos disponibles"
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column) => (
              <th 
                key={String(column.key)}
                className="text-left py-3 px-4 font-medium text-gray-900"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr 
              key={index}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {columns.map((column) => (
                <td 
                  key={String(column.key)}
                  className={cn("py-3 px-4", column.className)}
                >
                  {column.render 
                    ? column.render(item[column.key], item)
                    : String(item[column.key])
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 👥 PASO 3: Vista de Empleados

### Crear `src/components/dashboard/views/EmpleadosView.tsx`
```typescript
'use client';

import { ViewContainer } from '../ViewContainer';
import { DashboardCard } from '../DashboardCard';
import { StatsCard } from '../StatsCard';
import { DataTable } from '../DataTable';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/transitions';
import { Users, Plus, UserCheck, Clock, AlertTriangle } from 'lucide-react';

// Datos de ejemplo
const empleadosData = [
  { id: 1, nombre: 'Juan Pérez', departamento: 'Ventas', estado: 'Activo', turno: 'Mañana' },
  { id: 2, nombre: 'María González', departamento: 'Marketing', estado: 'Activo', turno: 'Tarde' },
  { id: 3, nombre: 'Carlos López', departamento: 'IT', estado: 'Vacaciones', turno: 'Noche' },
  { id: 4, nombre: 'Ana Martín', departamento: 'RRHH', estado: 'Activo', turno: 'Mañana' },
  { id: 5, nombre: 'Pedro Ruiz', departamento: 'Finanzas', estado: 'Licencia', turno: 'Tarde' },
];

const empleadosColumns = [
  { key: 'nombre' as const, label: 'Nombre' },
  { key: 'departamento' as const, label: 'Departamento' },
  { 
    key: 'estado' as const, 
    label: 'Estado',
    render: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value === 'Activo' 
          ? 'bg-green-100 text-green-800'
          : value === 'Vacaciones'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {value}
      </span>
    )
  },
  { key: 'turno' as const, label: 'Turno Actual' },
];

export function EmpleadosView() {
  return (
    <ViewContainer 
      title="Empleados" 
      subtitle="Gestión del equipo de trabajo"
      headerActions={
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Empleado
        </Button>
      }
    >
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FadeIn delay={0.1}>
            <StatsCard
              title="Total Empleados"
              value="24"
              change="+2 este mes"
              trend="up"
              icon={Users}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <StatsCard
              title="Empleados Activos"
              value="20"
              change="83% del total"
              trend="neutral"
              icon={UserCheck}
              color="text-green-600"
              bgColor="bg-green-50"
            />
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <StatsCard
              title="En Turno Actual"
              value="8"
              change="Turno de mañana"
              trend="neutral"
              icon={Clock}
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
          </FadeIn>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Empleados */}
          <div className="lg:col-span-2">
            <FadeIn delay={0.4}>
              <DashboardCard
                title="Lista de Empleados"
                subtitle="Empleados registrados en el sistema"
                icon={Users}
              >
                <DataTable
                  data={empleadosData}
                  columns={empleadosColumns}
                  emptyMessage="No hay empleados registrados"
                />
              </DashboardCard>
            </FadeIn>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            <FadeIn delay={0.5}>
              <DashboardCard
                title="Acciones Rápidas"
                icon={Plus}
                iconColor="text-blue-600"
              >
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    Agregar Empleado
                  </Button>
                  <Button className="w-full" variant="outline">
                    Importar Lista
                  </Button>
                  <Button className="w-full" variant="outline">
                    Exportar Datos
                  </Button>
                </div>
              </DashboardCard>
            </FadeIn>

            <FadeIn delay={0.6}>
              <DashboardCard
                title="Alertas"
                icon={AlertTriangle}
                iconColor="text-orange-600"
              >
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Empleados en vacaciones
                    </p>
                    <p className="text-sm text-yellow-700">
                      1 empleado actualmente
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Próximas incorporaciones
                    </p>
                    <p className="text-sm text-blue-700">
                      2 empleados la próxima semana
                    </p>
                  </div>
                </div>
              </DashboardCard>
            </FadeIn>
          </div>
        </div>
      </div>
    </ViewContainer>
  );
}
```

## 📅 PASO 4: Vista de Turnos

### Crear `src/components/dashboard/views/TurnosView.tsx`
```typescript
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
```

## 📊 PASO 5: Vista de Reportes

### Crear `src/components/dashboard/views/ReportesView.tsx`
```typescript
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
```

## ⚙️ PASO 6: Vista de Configuración

### Crear `src/components/dashboard/views/ConfiguracionView.tsx`
```typescript
'use client';

import { ViewContainer } from '../ViewContainer';
import { DashboardCard } from '../DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FadeIn } from '@/components/ui/transitions';
import { Settings, Save, Shield, Bell, Globe, User } from 'lucide-react';

export function ConfiguracionView() {
  return (
    <ViewContainer 
      title="Configuración" 
      subtitle="Personaliza el sistema según tus necesidades"
      headerActions={
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      }
    >
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración General */}
          <FadeIn delay={0.1}>
            <DashboardCard
              title="Configuración General"
              subtitle="Ajustes básicos del sistema"
              icon={Settings}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="empresa">Nombre de la Empresa</Label>
                  <Input id="empresa" placeholder="Mi Empresa S.A." />
                </div>
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Input id="timezone" value="UTC-3 (Argentina)" readOnly />
                </div>
                <div>
                  <Label htmlFor="moneda">Moneda</Label>
                  <Input id="moneda" value="ARS ($)" readOnly />
                </div>
              </div>
            </DashboardCard>
          </FadeIn>

          {/* Configuración de Usuario */}
          <FadeIn delay={0.2}>
            <DashboardCard
              title="Mi Perfil"
              subtitle="Información personal del usuario"
              icon={User}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" placeholder="usuario@empresa.com" />
                </div>
                <div>
                  <Label htmlFor="password">Cambiar Contraseña</Label>
                  <Input id="password" type="password" placeholder="Nueva contraseña" />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input id="confirm-password" type="password" placeholder="Confirmar nueva contraseña" />
                </div>
              </div>
            </DashboardCard>
          </FadeIn>

          {/* Notificaciones */}
          <FadeIn delay={0.3}>
            <DashboardCard
              title="Notificaciones"
              subtitle="Gestiona tus preferencias de notificaciones"
              icon={Bell}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificaciones por Email</p>
                    <p className="text-sm text-gray-600">Recibir alertas importantes</p>
                  </div>
                  <Button variant="outline" size="sm">Activado</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Recordatorios de Turnos</p>
                    <p className="text-sm text-gray-600">Notificar cambios en turnos</p>
                  </div>
                  <Button variant="outline" size="sm">Activado</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Reportes Automáticos</p>
                    <p className="text-sm text-gray-600">Envío semanal de reportes</p>
                  </div>
                  <Button variant="outline" size="sm">Desactivado</Button>
                </div>
              </div>
            </DashboardCard>
          </FadeIn>

          {/* Seguridad */}
          <FadeIn delay={0.4}>
            <DashboardCard
              title="Seguridad"
              subtitle="Configuración de seguridad y accesos"
              icon={Shield}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticación de Dos Factores</p>
                    <p className="text-sm text-gray-600">Protección adicional de la cuenta</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sesiones Activas</p>
                    <p className="text-sm text-gray-600">Gestionar dispositivos conectados</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Todas</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Registro de Actividad</p>
                    <p className="text-sm text-gray-600">Historial de acciones importantes</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Registro</Button>
                </div>
              </div>
            </DashboardCard>
          </FadeIn>
        </div>

        {/* Información del Sistema */}
        <FadeIn delay={0.5}>
          <DashboardCard
            title="Información del Sistema"
            subtitle="Detalles técnicos y soporte"
            icon={Globe}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Versión del Sistema</p>
                <p className="text-lg font-bold text-gray-900">v1.0.0</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Última Actualización</p>
                <p className="text-lg font-bold text-gray-900">15/08/2024</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Estado del Servidor</p>
                <p className="text-lg font-bold text-green-600">Operativo</p>
              </div>
            </div>
          </DashboardCard>
        </FadeIn>
      </div>
    </ViewContainer>
  );
}
```

## ✅ Validación

```bash
# Verificar TypeScript
npx tsc --noEmit

# Verificar compilación
npm run build

# Probar navegación:
# 1. Ir a /dashboard
# 2. Navegar por todas las secciones
# 3. Verificar que cada vista carga correctamente
# 4. Verificar componentes reutilizables
# 5. Probar responsive en móvil
```

## 🎯 Resultado

- ✅ **4 páginas de rutas** adicionales creadas
- ✅ **Componentes reutilizables** (DashboardCard, StatsCard, DataTable)
- ✅ **Vista de Empleados** completa con gestión
- ✅ **Vista de Turnos** con planificación
- ✅ **Vista de Reportes** con generación
- ✅ **Vista de Configuración** con ajustes
- ✅ **Navegación funcional** entre todas las vistas
- ✅ **Contenido base** implementado en todas las secciones

**Todas las vistas base están implementadas** y listas para la optimización responsive en la Fase 5.
