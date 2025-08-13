'use client';

import { Employee, Shift } from '@/lib/types';
import { daysOfWeek, formatYmd } from '@/lib/date';
import EmployeeRow from './EmployeeRow';
import { useMemo } from 'react';

type Props = {
  employees: Employee[];
  shifts: Shift[];
  start_date: string; // YYYY-MM-DD (lunes)
};

export default function WeeklyGrid({ employees, shifts, start_date }: Props) {
  const weekDays = useMemo(() => {
    const d = new Date(start_date + 'T00:00:00');
    return daysOfWeek(d).map((x) => ({ date: x, ymd: formatYmd(x) }));
  }, [start_date]);

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

  return (
    <div className="overflow-auto border rounded">
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
          {employees.map((emp) => {
            const rowShifts = weekDays.flatMap((d) => {
              const arr = shiftsByEmployeeAndDate.get(`${emp.id}|${d.ymd}`) ?? [];
              return arr;
            });
            return (
              <EmployeeRow key={emp.id} employee={emp} weekStart={start_date} shifts={rowShifts} />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


