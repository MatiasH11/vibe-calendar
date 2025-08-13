import WeeklyGrid from '@/components/planilla/WeeklyGrid';
import { cookies, headers } from 'next/headers';

export default async function PlanillaPage() {
  const token = cookies().get('auth_token')?.value;
  if (!token) {
    return <div>Sesión inválida</div>;
  }
  // Semana actual (lunes a domingo)
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // mover a lunes
  monday.setDate(monday.getDate() + diff);
  const start_date = monday.toISOString().slice(0, 10);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const end_date = sunday.toISOString().slice(0, 10);

  const hdrs = headers();
  const host = hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const base = `${proto}://${host}`;

  const [employeesRes, shiftsRes] = await Promise.all([
    fetch(`${base}/api/employees`, { cache: 'no-store' }),
    fetch(`${base}/api/shifts?start_date=${start_date}&end_date=${end_date}`, { cache: 'no-store' }),
  ]);
  const employeesJson = await employeesRes.json();
  const shiftsJson = await shiftsRes.json();

  const employees = employeesJson?.data ?? [];
  const shifts = shiftsJson?.data ?? [];

  return <WeeklyGrid employees={employees} shifts={shifts} start_date={start_date} />;
}


