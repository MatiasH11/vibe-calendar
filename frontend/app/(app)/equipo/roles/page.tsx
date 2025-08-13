import { headers } from 'next/headers';
import RoleTable from '@/components/equipo/RoleTable';
import RoleCreateButton from '@/components/equipo/RoleCreateButton';

export default async function RolesPage() {
	const hdrs = headers();
	const host = hdrs.get('host');
	const proto = hdrs.get('x-forwarded-proto') ?? 'http';
	const base = `${proto}://${host}`;
	const cookie = hdrs.get('cookie') ?? '';
	const res = await fetch(`${base}/api/roles`, { cache: 'no-store', headers: { cookie } });
	const json = await res.json();
	const roles = json?.data ?? [];
	return (
		<div className="p-4">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-semibold">Roles</h1>
				<RoleCreateButton />
			</div>
			<RoleTable initialRoles={roles} />
		</div>
	);
}

 


