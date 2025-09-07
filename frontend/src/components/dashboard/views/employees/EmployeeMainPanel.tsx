'use client';

import { DashboardCard } from '../../DashboardCard';
import { StatsCard } from '../../StatsCard';
import { FadeIn } from '@/components/ui/transitions';
import { Users, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmployeesStore } from '@/stores/employeesStore';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { EmployeePagination } from '@/components/employees/EmployeePagination';
import { EmployeeBreadcrumbs } from './EmployeeBreadcrumbs';
import { ContextualStatsCards } from '@/components/employees/ContextualStatsCards';
import { ContextualDistribution } from '@/components/employees/ContextualDistribution';
import { ContextualInsights } from '@/components/employees/ContextualInsights';
import { Employee } from '@/types/employee';
import { toast } from 'sonner';
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal';
import { UpdateEmployeeFormData } from '@/lib/validations/employee';

export function EmployeeMainPanel() {
  const { 
    filters, 
    roleFilter,
    selectedEmployee,
    isEditingEmployee,
    setFilters,
    setSelectedEmployee,
    setEditingEmployee
  } = useEmployeesStore();

  // Usar hook existente de empleados
  const { 
    employees, 
    total, 
    page, 
    totalPages, 
    isLoading, 
    error, 
    refetch,
    updateEmployee,
    deleteEmployee,
    toggleStatus,
    isUpdating,
    isDeleting,
    isToggling
  } = useEmployees(filters);

  // Calcular estadísticas
  const activeEmployees = employees.filter(emp => emp.is_active).length;
  const inactiveEmployees = employees.filter(emp => !emp.is_active).length;
  const totalEmployees = employees.length;

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditingEmployee(true);
  };

  const handleDeleteEmployee = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      deleteEmployee(id);
    }
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    toggleStatus({ id, isActive });
  };

  const handleUpdateEmployee = (data: UpdateEmployeeFormData) => {
    if (selectedEmployee) {
      updateEmployee({ id: selectedEmployee.id, data });
      setEditingEmployee(false);
      setSelectedEmployee(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingEmployee(false);
    setSelectedEmployee(null);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters({
      ...filters,
      ...newFilters,
      page: 1, // Reset a primera página
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters({ ...filters, limit: newLimit, page: 1 });
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error al cargar empleados
        </h3>
        <p className="text-gray-600 mb-4">
          {error.message || 'Ocurrió un error inesperado'}
        </p>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Estadísticas simplificadas */}
      <div className="p-4 bg-white border-b">
        <ContextualStatsCards />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
          {/* Header de tabla */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {roleFilter ? "Empleados Filtrados" : "Lista de Empleados"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {total} empleado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                </p>
              </div>
              {roleFilter && (
                <EmployeeBreadcrumbs />
              )}
            </div>
          </div>

          {/* Contenido de tabla */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-600">Cargando empleados...</p>
                </div>
              </div>
            ) : employees.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {roleFilter ? 'No hay empleados en este equipo' : 'No hay empleados registrados'}
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    {roleFilter 
                      ? 'Este equipo no tiene empleados asignados actualmente'
                      : 'Comienza agregando tu primer empleado al sistema'
                    }
                  </p>
                  {!roleFilter && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Agregar Empleado
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto">
                  <EmployeeTable
                    employees={employees}
                    onEdit={handleEditEmployee}
                    onDelete={handleDeleteEmployee}
                    onToggleStatus={handleToggleStatus}
                    filters={{
                      search: filters.search || '',
                      role_id: filters.role_id,
                      is_active: filters.is_active
                    }}
                    onFiltersChange={handleFiltersChange}
                    isDeleting={isDeleting}
                    isToggling={isToggling}
                  />
                </div>
                
                {totalPages > 1 && (
                  <div className="border-t bg-gray-50 px-6 py-4">
                    <EmployeePagination
                      currentPage={page}
                      totalPages={totalPages}
                      total={total}
                      limit={filters.limit || 10}
                      onPageChange={handlePageChange}
                      onLimitChange={handleLimitChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de edición de empleado */}
      <EmployeeFormModal
        isOpen={isEditingEmployee}
        employee={selectedEmployee}
        onSubmit={handleUpdateEmployee}
        onCancel={handleCancelEdit}
        isLoading={isUpdating}
      />
    </div>
  );
}
