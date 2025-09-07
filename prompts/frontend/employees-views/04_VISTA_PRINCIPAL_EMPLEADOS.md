# 🎯 FASE 4: Vista Principal Integrada de Empleados

## 🎯 Objetivo
Crear la vista principal de empleados que integre todos los componentes y hooks, conectada a la API real del backend.

## 🎯 PASO 1: Vista Principal de Empleados

### `src/components/dashboard/views/EmpleadosView.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { ViewContainer } from '../ViewContainer';
import { DashboardCard } from '../DashboardCard';
import { StatsCard } from '../StatsCard';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/transitions';
import { Users, Plus, UserCheck, Clock, AlertTriangle, Download, Upload } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmployeeStore } from '@/stores/employeeStore';
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { EmployeePagination } from '@/components/employees/EmployeePagination';
import { Employee } from '@/types/employee';
import { CreateEmployeeFormData, UpdateEmployeeFormData } from '@/lib/validations/employee';
import { PAGINATION } from '@/lib/constants';
import { toast } from 'sonner';

export function EmpleadosView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    role_id: undefined as number | undefined,
    is_active: undefined as boolean | undefined,
    page: PAGINATION.DEFAULT_PAGE,
    limit: PAGINATION.DEFAULT_LIMIT,
  });

  const { 
    employees, 
    total, 
    page, 
    totalPages, 
    isLoading, 
    error, 
    refetch,
    createEmployee, 
    updateEmployee, 
    deleteEmployee, 
    toggleStatus,
    isCreating,
    isUpdating,
    isDeleting,
    isToggling
  } = useEmployees(filters);

  const { setSelectedEmployee: setStoreEmployee } = useEmployeeStore();

  // Actualizar store cuando cambie el empleado seleccionado
  useEffect(() => {
    setStoreEmployee(selectedEmployee);
  }, [selectedEmployee, setStoreEmployee]);

  // Calcular estadísticas
  const activeEmployees = employees.filter(emp => emp.is_active).length;
  const inactiveEmployees = employees.filter(emp => !emp.is_active).length;
  const totalEmployees = employees.length;

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
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

  const handleFormSubmit = async (data: CreateEmployeeFormData | UpdateEmployeeFormData) => {
    try {
      if (selectedEmployee) {
        // Actualizar empleado existente
        await updateEmployee({ id: selectedEmployee.id, data: data as UpdateEmployeeFormData });
        toast.success('Empleado actualizado exitosamente');
      } else {
        // Crear nuevo empleado
        await createEmployee(data as CreateEmployeeFormData);
        toast.success('Empleado creado exitosamente');
      }
      setIsModalOpen(false);
      setSelectedEmployee(null);
      refetch();
    } catch (error) {
      toast.error('Error al guardar empleado');
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset a primera página cuando cambian los filtros
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleExportData = () => {
    // Implementar exportación de datos
    toast.info('Función de exportación en desarrollo');
  };

  const handleImportData = () => {
    // Implementar importación de datos
    toast.info('Función de importación en desarrollo');
  };

  if (error) {
    return (
      <ViewContainer
        title="Empleados"
        subtitle="Error al cargar empleados"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error al cargar empleados
            </h3>
            <p className="text-gray-600 mb-4">
              {error.message || 'Ocurrió un error inesperado'}
            </p>
            <Button onClick={() => refetch()}>
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </ViewContainer>
    );
  }

  return (
    <ViewContainer
      title="Empleados"
      subtitle="Gestión del equipo de trabajo"
      headerActions={
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleImportData}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleCreateEmployee}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Empleado
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FadeIn delay={0.1}>
            <StatsCard
              title="Total Empleados"
              value={totalEmployees.toString()}
              change={`${activeEmployees} activos`}
              trend="neutral"
              icon={Users}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <StatsCard
              title="Empleados Activos"
              value={activeEmployees.toString()}
              change={`${Math.round((activeEmployees / totalEmployees) * 100)}% del total`}
              trend="neutral"
              icon={UserCheck}
              color="text-green-600"
              bgColor="bg-green-50"
            />
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <StatsCard
              title="Empleados Inactivos"
              value={inactiveEmployees.toString()}
              change={`${Math.round((inactiveEmployees / totalEmployees) * 100)}% del total`}
              trend="neutral"
              icon={Clock}
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
          </FadeIn>
          
          <FadeIn delay={0.4}>
            <StatsCard
              title="Última Actualización"
              value="Hoy"
              change={new Date().toLocaleTimeString()}
              trend="neutral"
              icon={Clock}
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
          </FadeIn>
        </div>

        {/* Vista de Empleados */}
        <div className="space-y-6">
          <FadeIn delay={0.5}>
            <DashboardCard
              title="Lista de Empleados"
              subtitle={`${total} empleados encontrados`}
              icon={Users}
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
                    No hay empleados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {filters.search || filters.role_id || filters.is_active !== undefined
                      ? 'No se encontraron empleados con los filtros aplicados'
                      : 'Comienza agregando tu primer empleado'
                    }
                  </p>
                  {!filters.search && !filters.role_id && filters.is_active === undefined && (
                    <Button onClick={handleCreateEmployee}>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Empleado
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <EmployeeTable
                    employees={employees}
                    onEdit={handleEditEmployee}
                    onDelete={handleDeleteEmployee}
                    onToggleStatus={handleToggleStatus}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    isDeleting={isDeleting}
                    isToggling={isToggling}
                  />
                  
                  {totalPages > 1 && (
                    <div className="mt-6">
                      <EmployeePagination
                        currentPage={page}
                        totalPages={totalPages}
                        total={total}
                        limit={filters.limit}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                      />
                    </div>
                  )}
                </>
              )}
            </DashboardCard>
          </FadeIn>
        </div>

        {/* Acciones Rápidas */}
        <FadeIn delay={0.6}>
          <DashboardCard
            title="Acciones Rápidas"
            subtitle="Gestiona tu equipo de trabajo"
            icon={Users}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={handleCreateEmployee}
              >
                <Plus className="w-6 h-6 mb-2" />
                <span>Agregar Empleado</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={handleImportData}
              >
                <Upload className="w-6 h-6 mb-2" />
                <span>Importar Lista</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={handleExportData}
              >
                <Download className="w-6 h-6 mb-2" />
                <span>Exportar Datos</span>
              </Button>
            </div>
          </DashboardCard>
        </FadeIn>
      </div>

      {/* Modal de Formulario */}
      <EmployeeFormModal
        isOpen={isModalOpen}
        employee={selectedEmployee}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
        }}
        isLoading={isCreating || isUpdating}
      />
    </ViewContainer>
  );
}
```

## 🎯 PASO 2: Actualizar la Página Principal

### Actualizar `src/app/dashboard/empleados/page.tsx`
```typescript
'use client';

import { EmpleadosView } from '@/components/dashboard/views/EmpleadosView';

export default function EmpleadosPage() {
  return <EmpleadosView />;
}
```

## 🎯 PASO 3: Configurar Providers

### Verificar `src/lib/providers.tsx`
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
```

## 🎯 PASO 4: Instalar Dependencias Adicionales

### Comandos de instalación
```bash
# Instalar react-hook-form y validadores
npm install react-hook-form @hookform/resolvers

# Instalar sonner para notificaciones
npm install sonner

# Instalar componentes shadcn/ui adicionales
npx shadcn-ui@0.8.0 add dialog table badge select
```

## ✅ Validación de la Fase 4

```bash
# 1. Verificar que los archivos se crearon correctamente
ls src/components/dashboard/views/EmpleadosView.tsx
ls src/app/dashboard/empleados/page.tsx

# 2. OBLIGATORIO: Verificar que no hay errores de TypeScript
npm run build
# Si falla: DETENTE y corrige errores antes de continuar

# 3. OBLIGATORIO: Verificar que la aplicación funciona
npm run dev
# Ir a: http://localhost:3000/dashboard/empleados
# Verificar que la página carga sin errores en la consola del navegador

# 4. Verificar integración con backend
# En Network tab del navegador debe haber request a: http://localhost:3001/api/v1/employees
```

**CHECKLIST DE FUNCIONALIDAD MÍNIMA:**
□ La página /dashboard/empleados carga sin errores
□ Se muestran las estadísticas (aunque estén en 0)
□ El botón "Nuevo Empleado" abre el modal
□ No hay errores rojos en la consola del navegador
□ El sidebar del dashboard funciona correctamente

## 🎯 Resultado de la Fase 4

- ✅ **Vista principal integrada** con todos los componentes
- ✅ **Gestión completa de empleados** (CRUD)
- ✅ **Filtros y búsqueda** en tiempo real
- ✅ **Paginación** funcional
- ✅ **Estados de carga** y manejo de errores
- ✅ **Notificaciones** con toast
- ✅ **Modal de formulario** para crear/editar
- ✅ **Build sin errores** de TypeScript

**No se ejecutan las validaciones finales** - Solo la integración para la siguiente fase.
