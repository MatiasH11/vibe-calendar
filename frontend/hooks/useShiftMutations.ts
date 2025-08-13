'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Shift, StandardResponse } from '@/lib/types';
import { toast } from 'sonner';

type CreateShiftDTO = {
  company_employee_id: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
};

type UpdateShiftDTO = Partial<CreateShiftDTO>;

export function useShiftMutations({ startDate, endDate }: { startDate: string; endDate: string }) {
  const qc = useQueryClient();
  const key = ['shifts', startDate, endDate];

  const createShift = useMutation({
    mutationFn: async (dto: CreateShiftDTO) => {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      const json = (await res.json()) as StandardResponse<Shift>;
      if (!json.success) throw new Error(json.error?.message || 'Error al crear turno');
      return json.data!;
    },
    onMutate: async (dto) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Shift[]>(key) ?? [];
      qc.setQueryData<Shift[]>(key, [...prev, { id: -Date.now(), ...dto } as any]);
      return { prev };
    },
    onError: (err, _dto, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error((err as Error).message);
    },
    onSuccess: () => {
      toast.success('Turno creado');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });

  const updateShift = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateShiftDTO }) => {
      const res = await fetch(`/api/shifts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      const json = (await res.json()) as StandardResponse<Shift>;
      if (!json.success) throw new Error(json.error?.message || 'Error al actualizar turno');
      return json.data!;
    },
    onSuccess: () => {
      toast.success('Turno actualizado');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteShift = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar turno');
      return true;
    },
    onSuccess: () => {
      toast.success('Turno eliminado');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { createShift, updateShift, deleteShift };
}


