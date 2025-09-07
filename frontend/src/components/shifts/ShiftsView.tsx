'use client';

import { ViewContainer } from '../dashboard/ViewContainer';
import { ShiftsGrid } from './grid/ShiftsGrid';
import { ShiftsToolbar } from './ShiftsToolbar';
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
    employeesData,
    employeesLoading,
    employeesError,
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

  // Debug info
  console.log('🔍 ShiftsView Debug:', {
    employees,
    employeesData,
    employeesLoading,
    employeesError,
    isLoading,
    error
  });

  // Mostrar mensaje si no hay empleados
  if (!isLoading && !employeesLoading && employees.length === 0) {
    return (
      <ViewContainer title="Turnos" subtitle="No hay empleados disponibles">
        <div className="p-6 text-center">
          <p className="text-gray-500 mb-4">No se encontraron empleados activos</p>
          <p className="text-sm text-gray-400 mb-4">
            Debug: employeesData = {employeesData ? 'exists' : 'null'}, 
            employees.length = {employees.length}
          </p>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Actualizar
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
