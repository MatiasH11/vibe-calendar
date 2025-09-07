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
