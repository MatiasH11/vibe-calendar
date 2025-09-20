'use client';

import { useState } from 'react';
import { ViewContainer } from '../dashboard/ViewContainer';
import { ShiftsGrid } from './grid/ShiftsGrid';
import { ShiftsToolbar } from './ShiftsToolbar';
import { ShiftFormModal } from './ShiftFormModal';
import { FiltersIndicator } from './FiltersIndicator';
import { useShifts } from '@/hooks/shifts/useShifts';
import { useShiftForm } from '@/hooks/shifts/useShiftForm';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { FadeIn } from '@/components/ui/transitions';
import { Shift, EmployeeWithShifts } from '@/types/shifts/shift';
import { ShiftFormData } from '@/types/shifts/forms';

export function ShiftsView() {
  const { user, isAuthenticated } = useAuth();
  const { canManageShifts, isAdmin } = usePermissions();
  const {
    weekData,
    employees,
    allEmployees,
    currentWeek,
    isLoading,
    error,
    refreshData,
    navigateWeek,
    goToToday,
    filters,
    updateFilters,
    clearFilters,
    employeesData,
    employeesLoading,
    employeesError,
  } = useShifts();

  // Estado del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithShifts | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Handlers
  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setSelectedEmployee(null);
    setSelectedDate('');
    setIsModalOpen(true);
  };

  const handleCreateShift = (employeeId: number, date: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setSelectedDate(date);
      setSelectedShift(null);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedShift(null);
    setSelectedEmployee(null);
    setSelectedDate('');
  };

  const handleSubmitShift = async (data: ShiftFormData) => {
    try {
      // El formulario ya maneja la lógica de envío internamente
      // Solo necesitamos cerrar el modal después del éxito
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting shift:', error);
    }
  };

  // Verificar autenticación
  if (!isAuthenticated) {
    return (
      <ViewContainer title="Turnos" subtitle="Acceso no autorizado">
        <div className="p-6 text-center">
          <p className="text-red-600 mb-4">Debes iniciar sesión para acceder a esta sección</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Iniciar Sesión
          </button>
        </div>
      </ViewContainer>
    );
  }

  // Verificar permisos de administrador
  if (!canManageShifts) {
    return (
      <ViewContainer title="Turnos" subtitle="Acceso denegado">
        <div className="p-6 text-center">
          <p className="text-red-600 mb-4">No tienes permisos para gestionar turnos</p>
          <p className="text-gray-500 mb-4">Solo los administradores pueden crear y editar turnos</p>
        </div>
      </ViewContainer>
    );
  }

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
          filters={filters}
          onUpdateFilters={updateFilters}
          onClearFilters={clearFilters}
          allEmployees={allEmployees}
        />
      }
    >
      <div className="p-6">
        {/* Indicador de filtros */}
        <FiltersIndicator
          filters={filters}
          onUpdateFilters={updateFilters}
          onClearFilters={clearFilters}
          totalEmployees={allEmployees.length}
          filteredEmployees={employees.length}
        />

        {/* Grilla principal de turnos */}
        <FadeIn delay={0.1}>
          <ShiftsGrid
            weekData={weekData}
            employees={employees}
            isLoading={isLoading}
            onEditShift={handleEditShift}
            onCreateShift={handleCreateShift}
          />
        </FadeIn>
      </div>

      {/* Modal de formulario de turnos */}
      <ShiftFormModal
        isOpen={isModalOpen}
        shift={selectedShift || undefined}
        employee={selectedEmployee || undefined}
        selectedDate={selectedDate || undefined}
        employees={employees}
        onSubmit={handleSubmitShift}
        onCancel={handleCloseModal}
      />
    </ViewContainer>
  );
}
