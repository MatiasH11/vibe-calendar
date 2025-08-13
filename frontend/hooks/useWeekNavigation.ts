'use client';

import { useMemo, useState } from 'react';
import { getWeekRange, formatYmd } from '@/lib/date';

export function useWeekNavigation(initialDate = new Date()) {
  const [base, setBase] = useState<Date>(initialDate);
  const range = useMemo(() => getWeekRange(base, 1), [base]);
  const startDate = formatYmd(range.start);
  const endDate = formatYmd(range.end);

  const goPrev = () => setBase((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
  const goNext = () => setBase((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
  const goToday = () => setBase(new Date());

  return { startDate, endDate, goPrev, goNext, goToday } as const;
}


