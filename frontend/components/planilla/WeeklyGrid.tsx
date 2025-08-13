'use client';

import { Employee, Shift } from '@/lib/types';
import { daysOfWeek, formatYmd } from '@/lib/date';
import EmployeeRow from './EmployeeRow';
import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWeekNavigation } from '@/hooks/useWeekNavigation';
import { useShifts } from '@/hooks/useShifts';

type Props = {
  employees: Employee[];
  start_date: string; // YYYY-MM-DD (lunes)
  initial_shifts?: Shift[];
};

export default function WeeklyGrid({ employees, start_date, initial_shifts }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const { startDate, endDate, goPrev, goNext, goToday } = useWeekNavigation(new Date(start_date + 'T00:00:00'));
  const { data: shifts = [], isLoading, isError, refetch } = useShifts(startDate, endDate, { initialData: initial_shifts });

  const weekDays = useMemo(() => {
    const d = new Date(startDate + 'T00:00:00');
    return daysOfWeek(d).map((x) => ({ date: x, ymd: formatYmd(x) }));
  }, [startDate]);

  const shiftsByEmployeeAndDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const key = `${s.company_employee_id}|${s.shift_date}`;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [shifts]);

  const replaceWeekInUrl = (ymd: string) => {
    // Convertir YYYY-MM-DD a ISO week YYYY-Www
    const d = new Date(ymd + 'T00:00:00');
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Obtener ISO week number
    const thursday = new Date(tmp);
    thursday.setUTCDate(tmp.getUTCDate() + 3 - ((tmp.getUTCDay() + 6) % 7));
    const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
    const weekNumber = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
    const iso = `${thursday.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
    const sp = new URLSearchParams(params?.toString());
    sp.set('w', iso);
    router.replace(`?${sp.toString()}`);
  };

  const addDays = (ymd: string, days: number) => {
    const d = new Date(ymd + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return formatYmd(d);
  };

  const mondayOfToday = () => {
    const t = new Date();
    const day = t.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    t.setDate(t.getDate() + diff);
    return formatYmd(t);
  };

  return (
    <div className="overflow-auto border rounded">
      <div className="flex items-center justify-between p-3 border-b bg-white sticky top-0">
        <div className="flex gap-2">
          <button className="px-2 py-1 border rounded" onClick={() => { const prev = addDays(startDate, -7); replaceWeekInUrl(prev); goPrev(); }}>Semana anterior</button>
          <button className="px-2 py-1 border rounded" onClick={() => { const ymd = mondayOfToday(); replaceWeekInUrl(ymd); goToday(); }}>Hoy</button>
          <button className="px-2 py-1 border rounded" onClick={() => { const next = addDays(startDate, 7); replaceWeekInUrl(next); goNext(); }}>Siguiente semana</button>
        </div>
        {isLoading && <span className="text-sm text-neutral-500">Cargando…</span>}
        {isError && <button className="text-sm text-red-600 underline" onClick={() => refetch()}>Reintentar</button>}
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th className="text-left px-3 py-2 w-48">Empleado</th>
            {weekDays.map((d) => (
              <th key={d.ymd} className="px-3 py-2 text-left min-w-[140px]">{d.ymd}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-neutral-500" colSpan={8}>No hay empleados aún.</td>
            </tr>
          ) : employees.map((emp) => {
            const rowShifts = weekDays.flatMap((d) => {
              const arr = shiftsByEmployeeAndDate.get(`${emp.id}|${d.ymd}`) ?? [];
              return arr;
            });
            return (
              <EmployeeRow key={emp.id} employee={emp} weekStart={startDate} shifts={rowShifts} />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


