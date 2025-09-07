# 🎨 FASE 1: Diseño Unificado de Empleados

## 🎯 Objetivo
Crear una vista unificada que combine gestión de empleados y cargos en un diseño eficiente con panel principal (empleados) y sidebar contextual (cargos). **NO USAR TABS** - diseño integrado.

## 📝 PASO 1: Store Unificado para Empleados

### `src/stores/employeesStore.ts`
```typescript
import { create } from 'zustand';
import { Employee, EmployeeFilters, Cargo } from '@/types/employee';

interface EmployeesStore {
  // Estado de empleados  
  selectedEmployee: Employee | null;
  filters: EmployeeFilters;
  
  // Estado de roles (contextual) - Backend expandido soporta CRUD completo
  selectedRole: Role | null;
  roleFilter: number | null; // ID del rol para filtrar empleados
  roleInclude: 'stats' | 'employees' | null; // Para usar con /roles/advanced
  
  // Estado de UI
  isSidebarCollapsed: boolean;
  isCreatingEmployee: boolean;
  isCreatingCargo: boolean;
  searchTerm: string;
  
  // Acciones de empleados (con CRUD completo)
  setSelectedEmployee: (employee: Employee | null) => void;
  setFilters: (filters: EmployeeFilters) => void;
  resetFilters: () => void;
  
  // Acciones de roles (con CRUD completo)
  setSelectedRole: (role: Role | null) => void;
  setRoleFilter: (roleId: number | null) => void;
  setRoleInclude: (include: 'stats' | 'employees' | null) => void;
  
  // Acciones de UI
  toggleSidebar: () => void;
  setCreatingEmployee: (creating: boolean) => void;
  setCreatingRole: (creating: boolean) => void;
  setSearchTerm: (term: string) => void;
  
  // Acciones integradas (aprovechando backend expandido)
  filterByRole: (roleId: number) => void;
  clearAllFilters: () => void;
  enableStatsMode: () => void; // Para mostrar roles con contadores
  enableEmployeesMode: () => void; // Para mostrar roles con empleados
}

export const useEmployeesStore = create<EmployeesStore>((set, get) => ({
  // Estado inicial
  selectedEmployee: null,
  filters: {
    page: 1,
    limit: 10,
  },
  selectedRole: null,
  roleFilter: null,
  roleInclude: 'stats', // Por defecto mostrar contadores
  isSidebarCollapsed: false,
  isCreatingEmployee: false,
  isCreatingRole: false,
  searchTerm: '',
  
  // Acciones de empleados
  setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
  setFilters: (filters) => set({ filters: { ...filters } }),
  resetFilters: () => set({ 
    filters: { page: 1, limit: 10 },
    roleFilter: null,
    searchTerm: ''
  }),
  
  // Acciones de roles (usando endpoints expandidos)
  setSelectedRole: (role) => set({ selectedRole: role }),
  setRoleFilter: (roleId) => set({ 
    roleFilter: roleId,
    filters: { ...get().filters, role_id: roleId, page: 1 }
  }),
  setRoleInclude: (include) => set({ roleInclude: include }),
  
  // Acciones de UI
  toggleSidebar: () => set((state) => ({ 
    isSidebarCollapsed: !state.isSidebarCollapsed 
  })),
  setCreatingEmployee: (creating) => set({ isCreatingEmployee: creating }),
  setCreatingRole: (creating) => set({ isCreatingRole: creating }),
  setSearchTerm: (term) => set({ 
    searchTerm: term,
    filters: { ...get().filters, search: term, page: 1 }
  }),
  
  // Acciones integradas (aprovechando endpoints expandidos)
  filterByRole: (roleId) => {
    const state = get();
    set({
      roleFilter: roleId,
      filters: { 
        ...state.filters, 
        role_id: roleId, 
        page: 1 
      }
    });
  },
  
  clearAllFilters: () => set({ 
    filters: { page: 1, limit: 10 },
    roleFilter: null,
    searchTerm: '',
    selectedRole: null
  }),
  
  // Nuevas acciones para aprovechar backend expandido
  enableStatsMode: () => set({ roleInclude: 'stats' }),
  enableEmployeesMode: () => set({ roleInclude: 'employees' }),
}));
```

## 📝 PASO 2: Layout de Vista Unificada

### `src/components/dashboard/views/EmpleadosView.tsx`
Transformar completamente la vista:

```typescript
'use client';

import { ViewContainer } from '../ViewContainer';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useEmployeesStore } from '@/stores/employeesStore';

// Importar componentes (aprovechar CRUD completo del backend)
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
    toggleSidebar,
    setSearchTerm,
    setCreatingEmployee,
    setCreatingRole,
    clearAllFilters 
  } = useEmployeesStore();

  return (
    <ViewContainer
      title="Empleados"
      subtitle="Gestión integrada del equipo de trabajo"
    >
      <div className="flex h-full">
        {/* Panel Principal - Empleados */}
        <div className={`flex-1 transition-all duration-300 ${
          isSidebarCollapsed ? 'mr-0' : 'mr-80'
        }`}>
          <div className="p-6 h-full">
            {/* Header con filtros globales */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4 flex-1">
                {/* Búsqueda global */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar empleados..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Filtro activo */}
                {roleFilter && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Filter className="w-3 h-3" />
                    <span>Filtrado por rol</span>
                    <button 
                      onClick={clearAllFilters}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </Badge>
                )}
              </div>
              
              {/* Acciones principales */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="flex items-center space-x-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
                
                <Button
                  onClick={() => setCreatingEmployee(true)}
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Empleado</span>
                </Button>
                
                {/* Toggle sidebar */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSidebar}
                  className="p-2"
                >
                  {isSidebarCollapsed ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Panel principal de empleados */}
            <EmployeeMainPanel />
          </div>
        </div>
        
        {/* Sidebar Contextual - Roles (con CRUD completo) */}
        <div className={`fixed right-0 top-0 h-full transition-all duration-300 bg-white border-l shadow-lg z-10 ${
          isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'
        }`}>
          <RolesContextualSidebar />
        </div>
      </div>
      
      {/* Modales */}
      <EmployeeFormModal
        isOpen={isCreatingEmployee}
        onClose={() => setCreatingEmployee(false)}
      />
      
      <RoleFormModal
        isOpen={isCreatingRole}
        onClose={() => setCreatingRole(false)}
      />
    </ViewContainer>
  );
}
```

## 📝 PASO 3: Panel Principal de Empleados

### `src/components/dashboard/views/employees/EmployeeMainPanel.tsx`
```typescript
'use client';

import { DashboardCard } from '../../DashboardCard';
import { StatsCard } from '../../StatsCard';
import { FadeIn } from '@/components/ui/transitions';
import { Users, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmployeesStore } from '@/stores/employeesStore';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { EmployeePagination } from '@/components/employees/EmployeePagination';
import { Employee } from '@/types/employee';
import { toast } from 'sonner';

export function EmployeeMainPanel() {
  const { 
    filters, 
    roleFilter,
    setFilters,
    setSelectedEmployee 
  } = useEmployeesStore();

  // Usar endpoint expandido con filtros avanzados
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
  } = useEmployees(filters); // Hook actualizado para usar /employees/advanced

  // Calcular estadísticas
  const activeEmployees = employees.filter(emp => emp.is_active).length;
  const inactiveEmployees = employees.filter(emp => !emp.is_active).length;
  const totalEmployees = employees.length;

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleDeleteEmployee = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      try {
        await deleteEmployee(id);
        toast.success('Empleado eliminado exitosamente');
      } catch (error) {
        toast.error('Error al eliminar empleado');
      }
    }
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    try {
      await toggleStatus({ id, isActive });
    } catch (error) {
      toast.error('Error al cambiar estado del empleado');
    }
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
    <div className="space-y-6 h-full">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FadeIn delay={0.1}>
          <StatsCard
            title="Total"
            value={totalEmployees.toString()}
            change={roleFilter ? 'Filtrado' : 'Empleados'}
            trend="neutral"
            icon={Users}
            color="text-blue-600"
            bgColor="bg-blue-50"
            compact
          />
        </FadeIn>
        
        <FadeIn delay={0.2}>
          <StatsCard
            title="Activos"
            value={activeEmployees.toString()}
            change={`${Math.round((activeEmployees / totalEmployees) * 100) || 0}%`}
            trend="neutral"
            icon={UserCheck}
            color="text-green-600"
            bgColor="bg-green-50"
            compact
          />
        </FadeIn>
        
        <FadeIn delay={0.3}>
          <StatsCard
            title="Inactivos"
            value={inactiveEmployees.toString()}
            change={`${Math.round((inactiveEmployees / totalEmployees) * 100) || 0}%`}
            trend="neutral"
            icon={Clock}
            color="text-orange-600"
            bgColor="bg-orange-50"
            compact
          />
        </FadeIn>
        
        <FadeIn delay={0.4}>
          <StatsCard
            title="Páginas"
            value={totalPages.toString()}
            change={`${total} registros`}
            trend="neutral"
            icon={AlertTriangle}
            color="text-purple-600"
            bgColor="bg-purple-50"
            compact
          />
        </FadeIn>
      </div>

      {/* Lista de empleados */}
      <FadeIn delay={0.5} className="flex-1">
        <DashboardCard
                      title={roleFilter ? "Empleados Filtrados" : "Lista de Empleados"}
            subtitle={`${total} empleados encontrados`}
          icon={Users}
          className="h-full"
        >
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando empleados...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {roleFilter ? 'No hay empleados en este rol' : 'No hay empleados'}
              </h3>
              <p className="text-gray-600 mb-4">
                {roleFilter 
                  ? 'Este rol no tiene empleados asignados actualmente'
                  : 'Comienza agregando tu primer empleado'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <EmployeeTable
                employees={employees}
                onEdit={handleEditEmployee}
                onDelete={handleDeleteEmployee}
                onToggleStatus={handleToggleStatus}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                isDeleting={isDeleting}
                isToggling={isToggling}
                showRoleFilter={!roleFilter} // Ocultar filtro de rol si ya está filtrado
              />
              
              {totalPages > 1 && (
                <EmployeePagination
                  currentPage={page}
                  totalPages={totalPages}
                  total={total}
                  limit={filters.limit}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              )}
            </div>
          )}
        </DashboardCard>
      </FadeIn>
    </div>
  );
}
```

## 📝 PASO 4: Actualizar Constantes

### `src/lib/constants.ts`
Agregar configuraciones para la vista unificada:

```typescript
// Agregar al final del archivo
export const LAYOUT_CONFIG = {
  SIDEBAR_WIDTH: 320, // 80 * 4 = 320px (w-80)
  SIDEBAR_COLLAPSED_WIDTH: 0,
  MAIN_PANEL_MIN_WIDTH: 600,
  MOBILE_BREAKPOINT: 768,
} as const;

export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  SEARCH_DEBOUNCE: 500,
  STATS_UPDATE_INTERVAL: 30000, // 30 segundos
} as const;

export const EMPLOYEE_ACTIONS = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  TOGGLE_STATUS: 'toggle_status',
  FILTER_BY_ROLE: 'filter_by_role',
} as const;
```

## 📝 PASO 5: Placeholder para Sidebar

### `src/components/dashboard/views/employees/RolesContextualSidebar.tsx`
Sidebar con CRUD completo aprovechando backend expandido:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Search, Settings } from 'lucide-react';
import { useEmployeesStore } from '@/stores/employeesStore';

export function RolesContextualSidebar() {
  const { setCreatingRole } = useEmployeesStore();

  return (
    <div className="h-full flex flex-col">
      {/* Header del sidebar */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Roles</span>
          </h3>
          <Button
            size="sm"
            onClick={() => setCreatingRole(true)}
            className="h-8 px-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Búsqueda de roles */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar rol..."
            className="pl-10 h-8"
          />
        </div>
      </div>

      {/* Contenido del sidebar */}
      <div className="flex-1 p-4">
        <div className="text-center py-8">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Gestión de Roles
          </h4>
          <p className="text-gray-600 mb-4 text-sm">
            CRUD completo aprovechando backend expandido.
          </p>
          <Badge variant="outline">
            Backend con APIs Avanzadas
          </Badge>
        </div>
      </div>
      
      {/* Footer con acciones */}
      <div className="p-4 border-t bg-gray-50">
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>Configurar Roles</span>
        </Button>
      </div>
    </div>
  );
}
```

## 📝 PASO 6: Placeholder para Modales

### `src/components/employees/RoleFormModal.tsx`
```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoleFormModal({ isOpen, onClose }: RoleFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Gestión de Rol</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-8">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Formulario de Rol
          </h4>
          <p className="text-gray-600 mb-4 text-sm">
            CRUD completo con backend expandido.
          </p>
          <Badge variant="outline">
            APIs Avanzadas Disponibles
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## ✅ Validación de la Fase 1

```bash
# 1. Crear directorios necesarios
mkdir -p src/components/dashboard/views/employees

# 2. OBLIGATORIO: Verificar que no hay errores de TypeScript
npm run build
# Si falla: DETENTE y corrige errores antes de continuar

# 3. Verificar que la aplicación funciona
npm run dev
# Ir a: http://localhost:3000/dashboard/empleados
# Verificar que aparece la nueva vista unificada

# 4. Verificar responsividad
# - Redimensionar ventana
# - Verificar que sidebar se puede colapsar
# - Verificar que búsqueda funciona
# - Verificar que estadísticas se muestran

# 5. Verificar placeholder funciona
# - Click en "Nuevo Empleado" debe abrir modal existente
# - Click en "+" en sidebar debe abrir placeholder de cargo
# - Toggle sidebar debe funcionar
```

**CHECKLIST DE LA FASE 1:**
□ Store unificado implementado
□ Vista principal transformada (sin tabs)
□ Panel principal de empleados funcional
□ Sidebar placeholder visible
□ Layout responsivo funcionando
□ Búsqueda global operativa
□ Botones y acciones conectados
□ Build sin errores de TypeScript
□ Vista se ve profesional y unificada

## 🎯 Resultado de la Fase 1

- ✅ **Diseño unificado** implementado sin tabs
- ✅ **Layout responsivo** con panel principal y sidebar
- ✅ **Store centralizado** para manejar estado integrado
- ✅ **Búsqueda global** y filtros inteligentes
- ✅ **Estadísticas contextuales** en panel principal
- ✅ **Placeholders preparados** para siguiente fase
- ✅ **UX mejorada** sin fragmentación de contexto
- ✅ **Build sin errores** de TypeScript

**Base sólida creada** - Lista para implementar sidebar contextual en la siguiente fase.
