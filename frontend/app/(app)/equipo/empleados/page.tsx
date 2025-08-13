import { headers } from 'next/headers';
import EmployeeTable from '@/components/equipo/EmployeeTable';
import EmployeeCreateButton from '@/components/equipo/EmployeeCreateButton';

export default async function EmpleadosPage() {
	const hdrs = headers();
	const host = hdrs.get('host');
	const proto = hdrs.get('x-forwarded-proto') ?? 'http';
	const base = `${proto}://${host}`;
	const cookie = hdrs.get('cookie') ?? '';
	const [empsRes, rolesRes] = await Promise.all([
		fetch(`${base}/api/employees`, { cache: 'no-store', headers: { cookie } }),
		fetch(`${base}/api/roles`, { cache: 'no-store', headers: { cookie } }),
	]);
	const empsJson = await empsRes.json();
	const rolesJson = await rolesRes.json();
	const employees = empsJson?.data ?? [];
	const roles = rolesJson?.data ?? [];
	return (
		<div className="p-4">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-semibold">Empleados</h1>
				<EmployeeCreateButton />
			</div>
			<EmployeeTable initialEmployees={employees} />
		</div>
	);
}

 


