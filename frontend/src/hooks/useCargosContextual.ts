import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { 
  Cargo, 
  CreateCargoRequest, 
  UpdateCargoRequest,
  CargoWithEmployees 
} from '@/types/employee';
import { useEmployeesStore } from '@/stores/employeesStore';
import { toast } from 'sonner';

export function useCargosContextual() {
  const queryClient = useQueryClient();
  const { filterByRole, clearAllFilters, roleFilter } = useEmployeesStore();
  
  // Query principal para lista de cargos
  const {
    data: cargosResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['cargos-contextual'],
    queryFn: () => apiClient.getCargosWithStats(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 30 * 1000, // Actualizar cada 30 segundos
  });

  // Query para cargo específico con empleados
  const {
    data: selectedCargoData,
    isLoading: isLoadingSelected
  } = useQuery({
    queryKey: ['cargo-detail', roleFilter],
    queryFn: () => roleFilter ? apiClient.getCargoWithEmployees(roleFilter) : null,
    enabled: !!roleFilter,
    staleTime: 1 * 60 * 1000,
  });

  // Mutación para crear cargo
  const createMutation = useMutation({
    mutationFn: (data: CreateCargoRequest) => apiClient.createCargo(data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Cargo creado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['cargos-contextual'] });
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      } else {
        toast.error(response.error?.message || 'Error al crear cargo');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear cargo');
    },
  });

  // Mutación para actualizar cargo
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCargoRequest }) => 
      apiClient.updateCargo(id, data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Cargo actualizado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['cargos-contextual'] });
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        queryClient.invalidateQueries({ queryKey: ['cargo-detail'] });
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      } else {
        toast.error(response.error?.message || 'Error al actualizar cargo');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar cargo');
    },
  });

  // Mutación para eliminar cargo
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteCargo(id),
    onSuccess: (response, deletedId) => {
      if (response.success) {
        toast.success('Cargo eliminado exitosamente');
        // Limpiar filtro si el cargo eliminado estaba seleccionado
        if (roleFilter === deletedId) {
          clearAllFilters();
        }
        queryClient.invalidateQueries({ queryKey: ['cargos-contextual'] });
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      } else {
        toast.error(response.error?.message || 'Error al eliminar cargo');
      }
    },
  });

  // Procesar datos de respuesta
  const cargos: Cargo[] = cargosResponse?.data || [];
  const selectedCargo: CargoWithEmployees | null = selectedCargoData?.data || null;

  // Funciones de utilidad
  const handleFilterByRole = (cargoId: number) => {
    filterByRole(cargoId);
    toast.info(`Filtrando empleados por cargo`);
  };

  const handleClearFilter = () => {
    clearAllFilters();
    toast.info('Filtros eliminados');
  };

  const canDeleteCargo = (cargo: Cargo): boolean => {
    return (cargo._count?.employees || 0) === 0;
  };

  const getCargoStats = (cargo: Cargo) => {
    const employeeCount = cargo._count?.employees || 0;
    const isEmpty = employeeCount === 0;
    const isSelected = roleFilter === cargo.id;
    
    return {
      employeeCount,
      isEmpty,
      isSelected,
      canDelete: isEmpty,
      statusColor: isEmpty ? 'text-gray-500' : 'text-green-600',
      bgColor: isEmpty ? 'bg-gray-50' : 'bg-green-50',
    };
  };

  return {
    // Datos
    cargos,
    selectedCargo,
    roleFilter,
    
    // Estados de carga
    isLoading,
    isLoadingSelected,
    error,
    
    // Acciones CRUD
    createCargo: createMutation.mutate,
    updateCargo: updateMutation.mutate,
    deleteCargo: deleteMutation.mutate,
    
    // Estados de mutaciones
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Acciones de filtro
    filterByRole: handleFilterByRole,
    clearFilter: handleClearFilter,
    
    // Utilidades
    canDeleteCargo,
    getCargoStats,
    refetch,
  };
}
