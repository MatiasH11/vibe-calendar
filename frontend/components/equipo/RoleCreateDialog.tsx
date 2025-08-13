'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Role, StandardResponse } from '@/lib/types';

const schema = z.object({
	name: z.string().min(1, 'Requerido'),
	description: z.string().optional(),
	color: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Color HEX inválido').optional(),
});

type Values = z.infer<typeof schema>;

export default function RoleCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
	const qc = useQueryClient();
	const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', description: '', color: '' } });
	const createRole = useMutation({
		mutationFn: async (dto: Values) => {
			const res = await fetch('/api/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });
			const json = (await res.json()) as StandardResponse<Role>;
			if (!json.success) throw new Error(json.error?.message || 'Error al crear rol');
			return json.data!;
		},
		onSuccess: () => {
			toast.success('Rol creado');
			onOpenChange(false);
			form.reset();
			qc.invalidateQueries({ queryKey: ['roles'] });
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const onSubmit = form.handleSubmit(async (values) => {
		await createRole.mutateAsync(values);
	});

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/30" />
				<Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-lg w-full max-w-md p-4">
					<Dialog.Title className="text-lg font-semibold mb-2">Nuevo Rol</Dialog.Title>
					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-3">
							<FormField name="name" control={form.control} render={({ field }) => (
								<FormItem>
									<FormLabel>Nombre</FormLabel>
									<FormControl><Input placeholder="Ej: Cajero" {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<FormField name="description" control={form.control} render={({ field }) => (
								<FormItem>
									<FormLabel>Descripción</FormLabel>
									<FormControl><Input placeholder="Opcional" {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<FormField name="color" control={form.control} render={({ field }) => (
								<FormItem>
									<FormLabel>Color (HEX)</FormLabel>
									<FormControl><Input placeholder="#1D4ED8" {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<div className="flex justify-end gap-2 pt-2">
								<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
								<Button type="submit" disabled={createRole.isPending}>{createRole.isPending ? 'Guardando…' : 'Guardar'}</Button>
							</div>
						</form>
					</Form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}


