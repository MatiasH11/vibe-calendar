'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Shift } from '@/lib/types';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm

const createSchema = z.object({
  company_employee_id: z.number().int(),
  shift_date: z.string().min(1),
  start_time: z.string().regex(timeRegex, 'HH:mm'),
  end_time: z.string().regex(timeRegex, 'HH:mm'),
  notes: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  base?: { employeeId: number; date: string } | null;
  shift?: Shift | null;
  onCreate?: (v: CreateValues) => Promise<void> | void;
  onUpdate?: (id: number, v: Partial<CreateValues>) => Promise<void> | void;
  onDelete?: (id: number) => Promise<void> | void;
};

export default function ShiftEditorDialog({ open, onOpenChange, mode, base, shift, onCreate, onUpdate, onDelete }: Props) {
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: mode === 'create'
      ? { company_employee_id: base?.employeeId ?? 0, shift_date: base?.date ?? '', start_time: '', end_time: '', notes: '' }
      : { company_employee_id: shift?.company_employee_id ?? 0, shift_date: shift?.shift_date ?? '', start_time: shift?.start_time ?? '', end_time: shift?.end_time ?? '', notes: shift?.notes ?? '' },
    values: mode === 'create'
      ? { company_employee_id: base?.employeeId ?? 0, shift_date: base?.date ?? '', start_time: form.getValues('start_time') || '', end_time: form.getValues('end_time') || '', notes: form.getValues('notes') || '' }
      : { company_employee_id: shift?.company_employee_id ?? 0, shift_date: shift?.shift_date ?? '', start_time: shift?.start_time ?? '', end_time: shift?.end_time ?? '', notes: shift?.notes ?? '' },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    // Validación suave: end_time > start_time
    if (values.end_time <= values.start_time) {
      form.setError('end_time', { type: 'manual', message: 'La hora fin debe ser mayor que la hora inicio' });
      return;
    }
    if (mode === 'create' && onCreate) {
      await onCreate(values);
      onOpenChange(false);
      return;
    }
    if (mode === 'edit' && shift && onUpdate) {
      await onUpdate(shift.id, values);
      onOpenChange(false);
    }
  });

  const handleDelete = async () => {
    if (mode === 'edit' && shift && onDelete) {
      await onDelete(shift.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-lg w-full max-w-md p-4">
          <Dialog.Title className="text-lg font-semibold mb-2">{mode === 'create' ? 'Nuevo turno' : 'Editar turno'}</Dialog.Title>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="text-sm text-neutral-600">Fecha: {mode === 'create' ? base?.date : shift?.shift_date}</div>
              <FormField name="start_time" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora inicio (HH:mm)</FormLabel>
                  <FormControl><Input placeholder="09:00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="end_time" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora fin (HH:mm)</FormLabel>
                  <FormControl><Input placeholder="13:00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="notes" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl><Input placeholder="Opcional" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex items-center justify-between gap-3 pt-2">
                {mode === 'edit' ? (
                  <Button type="button" variant="outline" onClick={handleDelete}>Eliminar</Button>
                ) : <div />}
                <div className="flex gap-2 ml-auto">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Guardando…' : 'Guardar'}</Button>
                </div>
              </div>
            </form>
          </Form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


