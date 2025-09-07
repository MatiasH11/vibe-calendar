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
