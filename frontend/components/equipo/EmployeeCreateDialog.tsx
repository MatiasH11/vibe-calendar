'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Role, Employee as CompanyEmployee, StandardResponse } from '@/lib/types';

const schema = z.object({
	email: z.string().email('Email inválido'),
	first_name: z.string().min(1, 'Requerido'),
	last_name: z.string().min(1, 'Requerido'),
	role_id: z.number().int({ message: 'Seleccione un rol' }),
	position: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export default function EmployeeCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
	const qc = useQueryClient();
	const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', first_name: '', last_name: '', role_id: 0, position: '' } });
	const { data: roles = [] } = useQuery<Role[]>({
		queryKey: ['roles'],
		queryFn: async () => {
			const res = await fetch('/api/roles', { cache: 'no-store' });
			const json = (await res.json()) as StandardResponse<Role[]>;
			if (!json.success) throw new Error(json.error?.message || 'Error al cargar roles');
			return json.data ?? [];
		},
		staleTime: 30_000,
	});

	const createEmployee = useMutation({
		mutationFn: async (dto: Values) => {
			const res = await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });
			const json = (await res.json()) as StandardResponse<CompanyEmployee>;
			if (!json.success) throw new Error(json.error?.message || 'Error al crear empleado');
			return json.data!;
		},
		onSuccess: () => {
			toast.success('Empleado creado');
			onOpenChange(false);
			form.reset();
			qc.invalidateQueries({ queryKey: ['employees'] });
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const onSubmit = form.handleSubmit(async (values) => {
		await createEmployee.mutateAsync(values);
	});

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/30" />
				<Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-lg w-full max-w-md p-4">
					<Dialog.Title className="text-lg font-semibold mb-2">Agregar Empleado</Dialog.Title>
					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-3">
							<FormField name="email" control={form.control} render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl><Input type="email" placeholder="usuario@empresa.com" {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<div className="grid grid-cols-2 gap-3">
								<FormField name="first_name" control={form.control} render={({ field }) => (
									<FormItem>
										<FormLabel>Nombre</FormLabel>
										<FormControl><Input placeholder="Nombre" {...field} /></FormControl>
										<FormMessage />
									</FormItem>
								)} />
								<FormField name="last_name" control={form.control} render={({ field }) => (
									<FormItem>
										<FormLabel>Apellido</FormLabel>
										<FormControl><Input placeholder="Apellido" {...field} /></FormControl>
										<FormMessage />
									</FormItem>
								)} />
							</div>
							<FormField name="role_id" control={form.control} render={({ field }) => (
								<FormItem>
									<FormLabel>Rol</FormLabel>
									<FormControl>
										<select className="w-full border rounded px-2 py-2" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))}>
											<option value={0}>Seleccionar rol…</option>
											{roles.map((r) => (
												<option key={r.id} value={r.id}>{r.name}</option>
											))}
										</select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<FormField name="position" control={form.control} render={({ field }) => (
								<FormItem>
									<FormLabel>Posición (opcional)</FormLabel>
									<FormControl><Input placeholder="Ej: Part-time" {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<div className="flex justify-end gap-2 pt-2">
								<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
								<Button type="submit" disabled={createEmployee.isPending}>{createEmployee.isPending ? 'Guardando…' : 'Guardar'}</Button>
							</div>
						</form>
					</Form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}


