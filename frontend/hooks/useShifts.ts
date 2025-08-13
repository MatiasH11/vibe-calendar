'use client';

import { useQuery } from '@tanstack/react-query';
import { Shift, StandardResponse } from '@/lib/types';

export function useShifts(startDate: string, endDate: string, options?: { initialData?: Shift[] }) {
  return useQuery<Shift[]>({
    queryKey: ['shifts', startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/shifts?start_date=${startDate}&end_date=${endDate}`, { cache: 'no-store' });
      const json = (await res.json()) as StandardResponse<Shift[]>;
      if (!json.success) throw new Error(json.error?.message || 'Error al cargar turnos');
      return json.data ?? [];
    },
    enabled: Boolean(startDate && endDate),
    staleTime: 30 * 1000,
    initialData: options?.initialData,
  });
}


