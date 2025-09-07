# 🎨 FASE 3: Componentes de Vista de Turnos

## 🎯 Objetivo
Crear componentes específicos para la vista de turnos semanal tipo calendario. **Solo componentes**, no lógica de datos.

## 🧩 PASO 1: Componente Principal de Vista

### `components/shifts/ShiftsView.tsx`
```typescript
'use client';

import { ViewContainer } from '../dashboard/ViewContainer';
import { ShiftsGrid } from './grid/ShiftsGrid';
import { ShiftsToolbar } from './ShiftsToolbar';
import { ShiftsStats } from './ShiftsStats';
import { useShifts } from '@/hooks/shifts/useShifts';
import { FadeIn } from '@/components/ui/transitions';

export function ShiftsView() {
  const {
    weekData,
    employees,
    currentWeek,
    isLoading,
    error,
    refreshData,
    navigateWeek,
    goToToday,
  } = useShifts();

  if (error) {
    return (
      <ViewContainer title="Turnos" subtitle="Error al cargar los datos">
        <div className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </ViewContainer>
    );
  }

  return (
    <ViewContainer 
      title="Gestión de Turnos" 
      subtitle="Planificación semanal de turnos de trabajo"
      headerActions={
        <ShiftsToolbar
          currentWeek={currentWeek}
          onNavigateWeek={navigateWeek}
          onGoToToday={goToToday}
          onRefresh={refreshData}
          isLoading={isLoading}
        />
      }
    >
      <div className="p-6">
        {/* Grilla principal de turnos */}
        <FadeIn delay={0.1}>
          <ShiftsGrid
            weekData={weekData}
            employees={employees}
            isLoading={isLoading}
          />
        </FadeIn>
      </div>
    </ViewContainer>
  );
}
```

## 🧩 PASO 2: Componentes de Grilla

### `components/shifts/grid/ShiftsGrid.tsx`
```typescript
'use client';

import { WeekViewData, EmployeeWithShifts } from '@/types/shifts/shift';
import { ShiftGridHeader } from './ShiftGridHeader';
import { ShiftGridBody } from './ShiftGridBody';
import { ShiftGridFooter } from './ShiftGridFooter';
import { Loading } from '@/components/ui/loading';

interface ShiftsGridProps {
  weekData: WeekViewData | null;
  employees: EmployeeWithShifts[];
  isLoading: boolean;
}

export function ShiftsGrid({ weekData, employees, isLoading }: ShiftsGridProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8">
        <div className="flex items-center justify-center">
          <Loading size="lg" />
          <span className="ml-3 text-gray-600">Cargando turnos...</span>
        </div>
      </div>
    );
  }

  if (!weekData) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
        <p className="text-gray-500">No hay datos de turnos disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header con días de la semana */}
      <ShiftGridHeader days={weekData.days} />
      
      {/* Cuerpo con empleados y turnos */}
      <ShiftGridBody 
        employees={employees} 
        weekData={weekData}
      />
    </div>
  );
}
```

### `components/shifts/grid/ShiftGridHeader.tsx`
```typescript
'use client';

import { DayData } from '@/types/shifts/calendar';
import { formatDate } from '@/lib/dateUtils';

interface ShiftGridHeaderProps {
  days: DayData[];
}

export function ShiftGridHeader({ days }: ShiftGridHeaderProps) {
  return (
    <div className="grid grid-cols-8 bg-gray-50 border-b">
      {/* Columna de empleados */}
      <div className="p-4 font-medium text-gray-700 border-r">
        Empleados
      </div>
      
      {/* Días de la semana */}
      {days.map((day) => (
        <div 
          key={day.date}
          className={`p-4 text-center border-r last:border-r-0 ${
            day.isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
        >
          <div className="text-sm font-medium">{day.dayName}</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatDate(new Date(day.date), 'dd/MM')}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### `components/shifts/grid/ShiftGridBody.tsx`
```typescript
'use client';

import { WeekViewData, EmployeeWithShifts } from '@/types/shifts/shift';
import { ShiftCell } from './ShiftCell';
import { EmptyShiftCell } from './EmptyShiftCell';

interface ShiftGridBodyProps {
  employees: EmployeeWithShifts[];
  weekData: WeekViewData;
}

export function ShiftGridBody({ employees, weekData }: ShiftGridBodyProps) {
  return (
    <div className="divide-y">
      {employees.map((employee) => (
        <div key={employee.id} className="grid grid-cols-8 min-h-[80px]">
          {/* Información del empleado */}
          <div className="p-4 border-r bg-gray-50 flex items-center">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                style={{ backgroundColor: employee.role.color }}
              >
                {employee.user.first_name[0]}{employee.user.last_name[0]}
              </div>
              
              {/* Información */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {employee.user.first_name} {employee.user.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {employee.role.name}
                </p>
              </div>
            </div>
          </div>
          
          {/* Celdas de turnos por día */}
          {weekData.days.map((day) => {
            const dayShifts = employee.weekShifts.find(
              ws => ws.date === day.date
            )?.shifts || [];
            
            return (
              <div key={day.date} className="p-2 border-r last:border-r-0">
                {dayShifts.length > 0 ? (
                  <div className="space-y-1">
                    {dayShifts.map((shift) => (
                      <ShiftCell
                        key={shift.id}
                        shift={shift}
                        employee={employee}
                        day={day}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyShiftCell
                    employeeId={employee.id}
                    date={day.date}
                    roleColor={employee.role.color}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

### `components/shifts/grid/ShiftCell.tsx`
```typescript
'use client';

import { Shift, EmployeeWithShifts } from '@/types/shifts/shift';
import { DayData } from '@/types/shifts/calendar';
import { formatTime } from '@/lib/dateUtils';
import { ROLE_COLORS } from '@/lib/constants';

interface ShiftCellProps {
  shift: Shift;
  employee: EmployeeWithShifts;
  day: DayData;
}

export function ShiftCell({ shift, employee, day }: ShiftCellProps) {
  const roleColorClass = ROLE_COLORS[employee.role.name as keyof typeof ROLE_COLORS] || ROLE_COLORS.default;
  
  const handleClick = () => {
    // TODO: Implementar click handler
    console.log('Shift clicked:', shift);
  };

  return (
    <div
      className={`${roleColorClass} text-white text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={handleClick}
      title={`${employee.user.first_name} ${employee.user.last_name} - ${shift.start_time} a ${shift.end_time}`}
    >
      <div className="font-medium">
        {formatTime(new Date(`1970-01-01T${shift.start_time}:00`))} - 
        {formatTime(new Date(`1970-01-01T${shift.end_time}:00`))}
      </div>
      <div className="text-xs opacity-90 mt-1">
        {employee.role.name}
      </div>
      {shift.notes && (
        <div className="text-xs opacity-75 mt-1 truncate">
          {shift.notes}
        </div>
      )}
    </div>
  );
}
```

### `components/shifts/grid/EmptyShiftCell.tsx`
```typescript
'use client';

interface EmptyShiftCellProps {
  employeeId: number;
  date: string;
  roleColor: string;
}

export function EmptyShiftCell({ employeeId, date, roleColor }: EmptyShiftCellProps) {
  const handleClick = () => {
    // TODO: Implementar creación de turno
    console.log('Create shift for employee:', employeeId, 'date:', date);
  };

  return (
    <div
      className="w-full h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
      onClick={handleClick}
      title="Hacer clic para crear turno"
    >
      <div className="text-gray-400 text-xs">+</div>
    </div>
  );
}
```

### `components/shifts/grid/ShiftGridFooter.tsx`
```typescript
'use client';

import { DayData } from '@/types/shifts/calendar';
import { formatDate } from '@/lib/dateUtils';

interface ShiftGridFooterProps {
  days: DayData[];
}

export function ShiftGridFooter({ days }: ShiftGridFooterProps) {
  return (
    <div className="grid grid-cols-8 bg-gray-100 border-t">
      {/* Label */}
      <div className="p-4 font-medium text-gray-700 border-r">
        Salarios
      </div>
      
      {/* Resumen por día */}
      {days.map((day) => (
        <div key={day.date} className="p-4 text-center border-r last:border-r-0">
          <div className="text-sm font-medium text-gray-900">
            ${day.totalWages.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {day.totalHours}h
          </div>
          <div className="text-xs text-gray-400">
            {day.employeeCount} empleados
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 🧩 PASO 3: Componentes de Herramientas

### `components/shifts/ShiftsToolbar.tsx`
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, RotateCcw, Download, Plus, Filter } from 'lucide-react';

interface ShiftsToolbarProps {
  currentWeek: string;
  onNavigateWeek: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function ShiftsToolbar({
  currentWeek,
  onNavigateWeek,
  onGoToToday,
  onRefresh,
  isLoading
}: ShiftsToolbarProps) {
  return (
    <div className="flex items-center space-x-4">
      {/* Navegación de semana */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateWeek('prev')}
          disabled={isLoading}
        >
          ←
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateWeek('next')}
          disabled={isLoading}
        >
          →
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onGoToToday}
          disabled={isLoading}
        >
          Hoy
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Filtrar empleados..."
          className="w-48"
        />
        <Select>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="bar">Bar</SelectItem>
            <SelectItem value="cocina">Cocina</SelectItem>
            <SelectItem value="caja">Caja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Acciones */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Turno
        </Button>
      </div>
    </div>
  );
}
```


## ✅ Validación

```bash
# Verificar componentes (Windows)
dir components\shifts
dir components\shifts\grid

# Verificar compilación
npx tsc --noEmit

# Verificar que no hay errores
npm run build
```

## 🎯 Resultado

- **Componente principal** ShiftsView creado
- **Grilla semanal** con header y body
- **Celdas de turnos** con colores por rol
- **Herramientas** de navegación y filtros
- **Interfaz limpia** y simplificada
- **Componentes modulares** y reutilizables

**Los componentes están listos** para integrar con hooks y servicios.
