# 🎣 FASE 2: Hooks y Estado para Empleados

## 🎯 Objetivo
Crear hooks personalizados para la gestión de empleados y configurar el estado global con React Query y Zustand.

## 🎣 PASO 1: Hook Principal de Empleados

### `src/hooks/useEmployees.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { 
  Employee, 
  CreateEmployeeRequest, 
  UpdateEmployeeRequest, 
  EmployeeFilters,
  EmployeeListResponse 
} from '@/types/employee';
import { toast } from 'sonner';

export function useEmployees(filters?: EmployeeFilters) {
  const queryClient = useQueryClient();
  
  const {
    data: employeesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => apiClient.getEmployees(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeRequest) => apiClient.createEmployee(data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Empleado creado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      } else {
        toast.error(response.error?.message || 'Error al crear empleado');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear empleado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeRequest }) => 
      apiClient.updateEmployee(id, data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Empleado actualizado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      } else {
        toast.error(response.error?.message || 'Error al actualizar empleado');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar empleado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteEmployee(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Empleado eliminado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      } else {
        toast.error(response.error?.message || 'Error al eliminar empleado');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar empleado');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      apiClient.updateEmployee(id, { is_active: isActive }),
    onSuccess: (response) => {
      if (response.success) {
        const status = response.data?.is_active ? 'activado' : 'desactivado';
        toast.success(`Empleado ${status} exitosamente`);
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      } else {
        toast.error(response.error?.message || 'Error al cambiar estado');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cambiar estado');
    },
  });

  return {
    employees: employeesData?.data?.employees || [],
    total: employeesData?.data?.total || 0,
    page: employeesData?.data?.page || 1,
    totalPages: employeesData?.data?.totalPages || 1,
    isLoading,
    error,
    refetch,
    createEmployee: createMutation.mutate,
    updateEmployee: updateMutation.mutate,
    deleteEmployee: deleteMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleStatusMutation.isPending,
  };
}
```

## 🎣 PASO 2: Hook para Empleado Individual

### `src/hooks/useEmployee.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Employee, UpdateEmployeeRequest } from '@/types/employee';
import { toast } from 'sonner';

export function useEmployee(id: number) {
  const queryClient = useQueryClient();
  
  const {
    data: employeeData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => apiClient.getEmployee(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEmployeeRequest) => apiClient.updateEmployee(id, data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Empleado actualizado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['employee', id] });
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      } else {
        toast.error(response.error?.message || 'Error al actualizar empleado');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar empleado');
    },
  });

  return {
    employee: employeeData?.data,
    isLoading,
    error,
    refetch,
    updateEmployee: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
```

## 🎣 PASO 3: Hook para Roles

### `src/hooks/useRoles.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Role } from '@/types/api';

export function useRoles() {
  const {
    data: rolesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiClient.getRoles(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    roles: rolesData?.data || [],
    isLoading,
    error,
    refetch,
  };
}
```

## 🎣 PASO 4: Hook para Formularios

### `src/hooks/useEmployeeForm.ts`
```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  createEmployeeSchema, 
  updateEmployeeSchema,
  CreateEmployeeFormData,
  UpdateEmployeeFormData 
} from '@/lib/validations/employee';
import { Employee } from '@/types/employee';

export function useEmployeeForm(employee?: Employee) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const createForm = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      role_id: 0,
      position: '',
    },
  });

  const updateForm = useForm<UpdateEmployeeFormData>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      role_id: employee?.role_id || 0,
      position: employee?.position || '',
      is_active: employee?.is_active,
    },
  });

  const openCreateForm = () => {
    setIsOpen(true);
    setIsEditing(false);
    createForm.reset();
  };

  const openEditForm = (emp: Employee) => {
    setIsOpen(true);
    setIsEditing(true);
    updateForm.reset({
      role_id: emp.role_id,
      position: emp.position || '',
      is_active: emp.is_active,
    });
  };

  const closeForm = () => {
    setIsOpen(false);
    setIsEditing(false);
    createForm.reset();
    updateForm.reset();
  };

  return {
    isOpen,
    isEditing,
    createForm,
    updateForm,
    openCreateForm,
    openEditForm,
    closeForm,
  };
}
```

## 🎣 PASO 5: Store Global de Empleados

### `src/stores/employeeStore.ts`
```typescript
import { create } from 'zustand';
import { Employee, EmployeeFilters } from '@/types/employee';

interface EmployeeStore {
  selectedEmployee: Employee | null;
  filters: EmployeeFilters;
  setSelectedEmployee: (employee: Employee | null) => void;
  setFilters: (filters: EmployeeFilters) => void;
  resetFilters: () => void;
}

export const useEmployeeStore = create<EmployeeStore>((set) => ({
  selectedEmployee: null,
  filters: {
    page: 1,
    limit: 10,
  },
  setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
  setFilters: (filters) => set({ filters: { ...filters } }),
  resetFilters: () => set({ 
    filters: { 
      page: 1, 
      limit: 10 
    } 
  }),
}));
```

## ✅ Validación de la Fase 2

```bash
# 1. Verificar que los archivos se crearon correctamente
ls src/hooks/useEmployees.ts
ls src/hooks/useEmployee.ts
ls src/hooks/useRoles.ts
ls src/hooks/useEmployeeForm.ts
ls src/stores/employeeStore.ts

# 2. OBLIGATORIO: Verificar instalación de dependencias
npm install react-hook-form @hookform/resolvers sonner
# Si ya están instaladas, continuará sin error

# 3. OBLIGATORIO: Verificar que no hay errores de TypeScript
npm run build
# Si falla: DETENTE y corrige errores antes de continuar

# 4. Verificar que sonner está configurado en providers
# Verificar que en src/lib/providers.tsx existe: <Toaster position="top-right" richColors />
```

## 🎯 Resultado de la Fase 2

- ✅ **Hook principal** para gestión de empleados con React Query
- ✅ **Hook individual** para empleado específico
- ✅ **Hook para roles** con cache
- ✅ **Hook para formularios** con validación
- ✅ **Store global** para estado de empleados
- ✅ **Build sin errores** de TypeScript

**No se crean componentes UI** - Solo la lógica de negocio para la siguiente fase.
