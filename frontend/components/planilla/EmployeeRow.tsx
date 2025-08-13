'use client';

import { Employee, Shift } from '@/lib/types';
import { daysOfWeek, formatYmd } from '@/lib/date';
import { useMemo, useState } from 'react';
import ShiftEditorDialog from './ShiftEditorDialog';
import ShiftItem from './ShiftItem';
import { useShiftMutations } from '@/hooks/useShiftMutations';

type Props = {
  employee: Employee;
  weekStart: string; // YYYY-MM-DD
  shifts: Shift[];
};

export default function EmployeeRow({ employee, weekStart, shifts }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [base, setBase] = useState<{ employeeId: number; date: string } | null>(null);
  const [editing, setEditing] = useState<Shift | null>(null);

  const weekDays = useMemo(() => daysOfWeek(new Date(weekStart + 'T00:00:00')).map((d) => ({ d, ymd: formatYmd(d) })), [weekStart]);

  const startDate = weekDays[0]?.ymd ?? weekStart;
  const endDate = weekDays[6]?.ymd ?? weekStart;
  const mutations = useShiftMutations({ startDate, endDate });

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const arr = map.get(s.shift_date) ?? [];
      arr.push(s);
      map.set(s.shift_date, arr);
    }
    return map;
  }, [shifts]);

  return (
    <tr className="border-t">
      <td className="px-3 py-2">
        <div className="font-medium">{employee.user.first_name} {employee.user.last_name}</div>
        <div className="text-neutral-500">{employee.role.name}</div>
      </td>
      {weekDays.map((wd) => {
        const list = shiftsByDate.get(wd.ymd) ?? [];
        return (
          <td key={wd.ymd} className="px-3 py-2 align-top">
            {list.length === 0 ? (
              <button
                className="text-neutral-400 hover:underline"
                onClick={() => { setMode('create'); setBase({ employeeId: employee.id, date: wd.ymd }); setOpen(true); }}
              >
                Añadir
              </button>
            ) : (
              <ul className="space-y-1">
                {list.map((s) => (
                  <li key={s.id}>
                    <button
                      className="w-full text-left hover:bg-neutral-50 rounded"
                      onClick={() => { setMode('edit'); setEditing(s); setOpen(true); }}
                    >
                      <ShiftItem shift={s} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </td>
        );
      })}

      <ShiftEditorDialog
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        base={base}
        shift={editing}
        onCreate={async (v) => { await mutations.createShift.mutateAsync(v); setEditing(null); setBase(null); }}
        onUpdate={async (id, v) => { await mutations.updateShift.mutateAsync({ id, dto: v }); setEditing(null); setBase(null); }}
        onDelete={async (id) => { await mutations.deleteShift.mutateAsync(id); setEditing(null); setBase(null); }}
      />
    </tr>
  );
}


