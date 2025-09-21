'use client';

import { useState, useEffect } from 'react';
import { ViewContainer } from '../dashboard/ViewContainer';
import { ShiftsGrid } from './grid/ShiftsGrid';
import { ShiftsToolbar } from './ShiftsToolbar';
import { ShiftFormModal } from './ShiftFormModal';
import { FiltersIndicator } from './FiltersIndicator';
import { ShiftTemplateManager } from './templates/ShiftTemplateManager';

import { SimpleShortcutHelp } from './shortcuts/SimpleShortcutHelp';
import { ShiftDuplicator } from './duplication/ShiftDuplicator';

import { useShifts } from '@/hooks/shifts/useShifts';
import { useHotkeys } from '@/hooks/shifts/useHotkeys';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useShiftsStore } from '@/stores/shiftsStore';
import { FadeIn } from '@/components/ui/transitions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, FileText, Keyboard, Copy } from 'lucide-react';
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

  // Enhanced store integration
  const {
    showTemplateManager,
    setShowTemplateManager,
    showShortcutHelp,
    setShowShortcutHelp,
    shortcutsEnabled,
    setShortcutsEnabled,
    selectedShift: storeSelectedShift,
    setSelectedShift: setStoreSelectedShift,
    loadTemplates,
    templates
  } = useShiftsStore();

  // Estado del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithShifts | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDuplicator, setShowDuplicator] = useState(false);
  const [contextMenuShift, setContextMenuShift] = useState<Shift | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Load templates on component mount
  useEffect(() => {
    if (templates.length === 0) {
      loadTemplates();
    }
  }, [loadTemplates, templates.length]);

  // Enhanced handlers with keyboard shortcuts and context menu support
  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setStoreSelectedShift(shift);
    setSelectedEmployee(null);
    setSelectedDate('');
    setIsModalOpen(true);
    setContextMenuPosition(null);
  };

  const handleCreateShift = (employeeId: number, date: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setSelectedDate(date);
      setSelectedShift(null);
      setStoreSelectedShift(null);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedShift(null);
    setSelectedEmployee(null);
    setSelectedDate('');
    setStoreSelectedShift(null);
  };

  const handleSubmitShift = async (data: ShiftFormData) => {
    try {
      // El formulario ya maneja la lógica de envío internamente
      // Solo necesitamos cerrar el modal después del éxito
      handleCloseModal();
      // Refresh data to show the new/updated shift
      await refreshData();
    } catch (error) {
      console.error('Error submitting shift:', error);
    }
  };

  // Context menu handlers
  const handleRightClick = (event: React.MouseEvent, shift: Shift) => {
    event.preventDefault();
    setContextMenuShift(shift);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  };

  const handleContextMenuClose = () => {
    setContextMenuPosition(null);
    setContextMenuShift(null);
  };

  const handleDuplicateShift = (shift: Shift) => {
    setSelectedShift(shift);
    setStoreSelectedShift(shift);
    setShowDuplicator(true);
    handleContextMenuClose();
  };

  // Keyboard shortcut handlers
  const shortcutHandlers = {
    onCreateShift: () => {
      console.log('Creating new shift via shortcut');
      setSelectedShift(null);
      setSelectedEmployee(null);
      setSelectedDate('');
      setIsModalOpen(true);
    },
    onDuplicateShift: () => {
      console.log('Duplicating shift via shortcut');
      if (storeSelectedShift) {
        handleDuplicateShift(storeSelectedShift);
      }
    },
    onShowHelp: () => {
      console.log('Showing help via shortcut');
      setShowShortcutHelp(true);
    },
    onNavigateWeek: (direction: 'prev' | 'next') => {
      console.log(`Navigating to ${direction} week via shortcut`);
      navigateWeek(direction);
    },
    onGoToToday: () => {
      console.log('Going to today via shortcut');
      goToToday();
    },
    onToggleTemplates: () => {
      console.log('Toggling templates via shortcut');
      setShowTemplateManager(!showTemplateManager);
    },
    onFocusSearch: () => {
      console.log('Focusing search via shortcut');
      // Implementar focus en el campo de búsqueda si existe
    }
  };

  // Usar hotkeys-js para atajos de teclado
  useHotkeys(shortcutHandlers, shortcutsEnabled);

  // Debug: Log when shortcuts are enabled/disabled
  useEffect(() => {
    console.log('Shortcuts enabled state changed:', shortcutsEnabled);
  }, [shortcutsEnabled]);

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
        <div className="flex items-center gap-2">
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

          {/* Enhanced toolbar buttons */}
          <div className="flex items-center gap-1 ml-2 border-l pl-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTemplateManager(true)}
              title="Gestionar Plantillas (T)"
            >
              <FileText className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShortcutsEnabled(!shortcutsEnabled)}
              title={`${shortcutsEnabled ? 'Desactivar' : 'Activar'} Atajos de Teclado`}
              className={shortcutsEnabled ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}
            >
              <Keyboard className="h-4 w-4" />
              {shortcutsEnabled && <span className="ml-1 text-xs">ON</span>}
              {!shortcutsEnabled && <span className="ml-1 text-xs">OFF</span>}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcutHelp(true)}
              title="Ayuda de Atajos (?)"
            >
              ?
            </Button>
          </div>
        </div>
      }
    >
      {/* Main content wrapper */}
      <div className="p-6">
        {/* Indicador de filtros */}
        <FiltersIndicator
          filters={filters}
          onUpdateFilters={updateFilters}
          onClearFilters={clearFilters}
          totalEmployees={allEmployees.length}
          filteredEmployees={employees.length}
        />

        {/* Grilla principal de turnos con context menu support */}
        <FadeIn delay={0.1}>
          <div className="relative">
            <ShiftsGrid
              weekData={weekData}
              employees={employees}
              isLoading={isLoading}
              onEditShift={handleEditShift}
              onCreateShift={handleCreateShift}
              onRightClick={handleRightClick}
            />

            {/* Context menu for shift duplication */}
            {contextMenuPosition && contextMenuShift && (
              <div
                className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[150px]"
                style={{
                  left: contextMenuPosition.x,
                  top: contextMenuPosition.y,
                }}
                onMouseLeave={handleContextMenuClose}
              >
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => handleEditShift(contextMenuShift)}
                >
                  <Settings className="h-4 w-4" />
                  Editar Turno
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => handleDuplicateShift(contextMenuShift)}
                >
                  <Copy className="h-4 w-4" />
                  Duplicar Turno
                </button>
              </div>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Enhanced modal with template support */}
      <ShiftFormModal
        isOpen={isModalOpen}
        shift={selectedShift || undefined}
        employee={selectedEmployee || undefined}
        selectedDate={selectedDate || undefined}
        employees={employees}
        onSubmit={handleSubmitShift}
        onCancel={handleCloseModal}
        enableTemplates={true}
        enableShortcuts={shortcutsEnabled}
        enableSuggestions={true}
      />

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <Dialog open={showTemplateManager} onOpenChange={setShowTemplateManager}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestionar Plantillas de Turnos</DialogTitle>
              <DialogDescription>
                Crea, edita y administra plantillas de turnos para facilitar la planificación
              </DialogDescription>
            </DialogHeader>
            <ShiftTemplateManager />
          </DialogContent>
        </Dialog>
      )}

      {/* Shift Duplicator Modal */}
      {showDuplicator && selectedShift && (
        <Dialog open={showDuplicator} onOpenChange={setShowDuplicator}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Duplicar Turno</DialogTitle>
              <DialogDescription>
                Selecciona los empleados y fechas para duplicar el turno
              </DialogDescription>
            </DialogHeader>
            <ShiftDuplicator
              sourceShift={selectedShift}
              employees={employees}
              onDuplicate={(shifts) => {
                setShowDuplicator(false);
                refreshData();
              }}
              onCancel={() => setShowDuplicator(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Keyboard Shortcuts Help */}
      <SimpleShortcutHelp
        isOpen={showShortcutHelp}
        onClose={() => setShowShortcutHelp(false)}
      />

      {/* Click outside handler for context menu */}
      {contextMenuPosition && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleContextMenuClose}
        />
      )}

    </ViewContainer>
  );
}
