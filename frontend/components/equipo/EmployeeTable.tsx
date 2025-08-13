'use client';

import { useQuery } from '@tanstack/react-query';
import { Employee as CompanyEmployee, Role, StandardResponse } from '@/lib/types';

export default function EmployeeTable({ initialEmployees }: { initialEmployees?: CompanyEmployee[] }) {
	const { data: employees = [], isLoading, isError, refetch } = useQuery<CompanyEmployee[]>({
		queryKey: ['employees'],
		queryFn: async () => {
			const res = await fetch('/api/employees', { cache: 'no-store' });
			const json = (await res.json()) as StandardResponse<CompanyEmployee[]>;
			if (!json.success) throw new Error(json.error?.message || 'Error al cargar empleados');
			return json.data ?? [];
		},
		initialData: initialEmployees,
		staleTime: 30_000,
	});

	if (isLoading) return <p className="text-neutral-500">Cargando…</p>;
	if (isError) return <button className="text-red-600 underline" onClick={() => refetch()}>Reintentar</button>;

	if (!employees || employees.length === 0) {
		return <p className="text-neutral-500">No hay empleados aún.</p>;
	}

	return (
		<table className="min-w-full text-sm border">
			<thead className="bg-neutral-50">
				<tr>
					<th className="text-left px-3 py-2">Nombre</th>
					<th className="text-left px-3 py-2">Email</th>
					<th className="text-left px-3 py-2">Rol</th>
					<th className="text-left px-3 py-2">Posición</th>
					<th className="text-left px-3 py-2">Estado</th>
				</tr>
			</thead>
			<tbody>
				{employees.map((e) => (
					<tr key={e.id} className="border-t">
						<td className="px-3 py-2">{e.user?.first_name} {e.user?.last_name}</td>
						<td className="px-3 py-2">{e.user?.email}</td>
						<td className="px-3 py-2">{e.role?.name}</td>
						<td className="px-3 py-2">{e.position ?? '-'}</td>
						<td className="px-3 py-2">{e.is_active ? 'Activo' : 'Inactivo'}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}


