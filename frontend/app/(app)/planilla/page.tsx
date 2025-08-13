import WeeklyGrid from '@/components/planilla/WeeklyGrid';
import { cookies, headers } from 'next/headers';

type SearchParams = { [key: string]: string | string[] | undefined };

function isoWeekStartDateYmd(iso: string | undefined): string | null {
  if (!iso) return null;
  const match = /^([0-9]{4})-W([0-9]{1,2})$/.exec(Array.isArray(iso) ? iso[0] : iso);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!year || !week || week < 1 || week > 53) return null;
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7; // 1..7 (Mon=1)
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - day + 1);
  const targetMonday = new Date(week1Monday);
  targetMonday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return targetMonday.toISOString().slice(0, 10);
}

export default async function PlanillaPage({ searchParams }: { searchParams: SearchParams }) {
  const token = cookies().get('auth_token')?.value;
  if (!token) {
    return <div>Sesión inválida</div>;
  }

  // Determinar semana base por URL (?w=YYYY-Www o ?start_date=YYYY-MM-DD)
  const startFromIsoWeek = isoWeekStartDateYmd(searchParams?.w as string | undefined);
  const startFromParam = (searchParams?.start_date as string | undefined)?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? (searchParams?.start_date as string)
    : null;

  let start_date = startFromIsoWeek || startFromParam || '';
  if (!start_date) {
    const today = new Date();
    const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const day = monday.getUTCDay();
    const diff = (day === 0 ? -6 : 1) - day; // mover a lunes (UTC)
    monday.setUTCDate(monday.getUTCDate() + diff);
    start_date = monday.toISOString().slice(0, 10);
  }
  const monday = new Date(start_date + 'T00:00:00Z');
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
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

  return <WeeklyGrid employees={employees} start_date={start_date} initial_shifts={shifts} />;
}


