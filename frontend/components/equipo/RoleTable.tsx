'use client';

import { useQuery } from '@tanstack/react-query';
import { Role, StandardResponse } from '@/lib/types';

export default function RoleTable({ initialRoles }: { initialRoles?: Role[] }) {
	const { data: roles = [], isLoading, isError, refetch } = useQuery<Role[]>({
		queryKey: ['roles'],
		queryFn: async () => {
			const res = await fetch('/api/roles', { cache: 'no-store' });
			const json = (await res.json()) as StandardResponse<Role[]>;
			if (!json.success) throw new Error(json.error?.message || 'Error al cargar roles');
			return json.data ?? [];
		},
		initialData: initialRoles,
		staleTime: 30_000,
	});

	if (isLoading) return <p className="text-neutral-500">Cargando…</p>;
	if (isError) return <button className="text-red-600 underline" onClick={() => refetch()}>Reintentar</button>;

	if (!roles || roles.length === 0) {
		return <p className="text-neutral-500">No hay roles aún.</p>;
	}

	return (
		<table className="min-w-full text-sm border">
			<thead className="bg-neutral-50">
				<tr>
					<th className="text-left px-3 py-2">Nombre</th>
					<th className="text-left px-3 py-2">Descripción</th>
					<th className="text-left px-3 py-2">Color</th>
				</tr>
			</thead>
			<tbody>
				{roles.map((r) => (
					<tr key={r.id} className="border-t">
						<td className="px-3 py-2">{r.name}</td>
						<td className="px-3 py-2">{r.description ?? '-'}</td>
						<td className="px-3 py-2">{r.color ?? '-'}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}


