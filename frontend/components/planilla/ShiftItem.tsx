import { Shift } from '@/lib/types';

export default function ShiftItem({ shift }: { shift: Shift }) {
  return (
    <div className="rounded border px-2 py-1 text-sm">
      {shift.start_time}–{shift.end_time}
    </div>
  );
}


