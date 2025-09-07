'use client';

import { ViewContainer } from '../ViewContainer';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  Users, 
  UserCheck,
  Clock,
  Plus,
  X
} from 'lucide-react';
import { useEmployeesStore } from '@/stores/employeesStore';

// Importar componentes (aprovechando CRUD completo del backend)
import { EmployeeMainPanel } from './employees/EmployeeMainPanel';
import { RolesContextualSidebar } from './employees/RolesContextualSidebar';
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal';
import { RoleFormModal } from '@/components/employees/RoleFormModal';

export function EmpleadosView() {
  const { 
    isSidebarCollapsed, 
    roleFilter, 
    searchTerm, 
    isCreatingEmployee,
    isCreatingRole,
    filters,
    toggleSidebar,
    setSearchTerm,
    setCreatingEmployee,
    setCreatingRole,
    setFilters,
    clearAllFilters 
  } = useEmployeesStore();

  const setFilterStatus = (status: 'active' | 'inactive') => {
    setFilters({
      ...filters,
      is_active: status === 'active' ? true : false,
      page: 1 // Reset to first page when filtering
    });
  };

  return (
    <ViewContainer
      title="Empleados"
      subtitle="Gestión integrada del equipo de trabajo"
    >
      {/* Header simplificado y moderno */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Título y búsqueda */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Empleados</h1>
              </div>
              
              {/* Búsqueda global */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email o rol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            
            {/* Acciones principales */}
            <div className="flex items-center space-x-3">
              {/* Dropdown de filtros */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="flex items-center space-x-2"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filtros</span>
                    {roleFilter && (
                      <Badge variant="secondary" className="ml-1 px-1">
                        1
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterStatus('active')}>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Solo empleados activos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('inactive')}>
                    <Clock className="w-4 h-4 mr-2" />
                    Solo empleados inactivos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {roleFilter && (
                    <DropdownMenuItem onClick={clearAllFilters} className="text-red-600">
                      <X className="w-4 h-4 mr-2" />
                      Limpiar filtros
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                onClick={() => setCreatingEmployee(true)}
                className="flex items-center space-x-2"
                size="default"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Empleado</span>
              </Button>
            </div>
          </div>
          
          {/* Filtros activos */}
          {roleFilter && (
            <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
              <span className="text-sm text-gray-500">Filtros activos:</span>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Filter className="w-3 h-3" />
                <span>Rol: {roleFilter}</span>
                <button 
                  onClick={clearAllFilters}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Layout principal responsive */}
      <div className="flex h-[calc(100vh-14rem)] overflow-hidden">
        {/* Panel Principal - Empleados */}
        <div className="flex-1 min-w-0">
          <EmployeeMainPanel />
        </div>
        
        {/* Sidebar Contextual - Equipos - Solo visible en desktop */}
        <div className="hidden lg:block w-80 bg-gray-50 border-l">
          <RolesContextualSidebar />
        </div>
      </div>
      
      {/* Modales */}
      <EmployeeFormModal
        isOpen={isCreatingEmployee}
        onSubmit={() => {
          // TODO: Implementar onSubmit cuando se conecte con hooks
          setCreatingEmployee(false);
        }}
        onCancel={() => setCreatingEmployee(false)}
      />
      
      <RoleFormModal
        isOpen={isCreatingRole}
        onClose={() => setCreatingRole(false)}
      />
    </ViewContainer>
  );
}