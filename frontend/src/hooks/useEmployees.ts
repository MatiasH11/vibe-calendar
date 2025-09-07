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

  // Manejar diferentes estructuras de respuesta del backend
  let employees: Employee[] = [];
  let total = 0;
  let page = 1;
  let totalPages = 1;

  if (employeesData?.data) {
    // Si la respuesta tiene estructura paginada
    if (Array.isArray(employeesData.data.employees)) {
      employees = employeesData.data.employees;
      total = employeesData.data.total || employees.length;
      page = employeesData.data.page || 1;
      totalPages = employeesData.data.totalPages || 1;
    }
    // Si la respuesta es directamente un array de empleados
    else if (Array.isArray(employeesData.data)) {
      employees = employeesData.data;
      total = employees.length;
      page = 1;
      totalPages = 1;
    }
  }

  const result = {
    employees,
    total,
    page,
    totalPages,
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

  return result;
}
