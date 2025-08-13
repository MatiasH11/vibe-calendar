import { addDays, eachDayOfInterval, endOfWeek, format, startOfWeek } from 'date-fns';

export function getWeekRange(baseDate: Date, weekStartsOn: 0 | 1 = 1) {
  const start = startOfWeek(baseDate, { weekStartsOn });
  const end = endOfWeek(baseDate, { weekStartsOn });
  return { start, end } as const;
}

export function formatYmd(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function formatHm(dateOrString: Date | string): string {
  if (typeof dateOrString === 'string') return dateOrString.slice(0, 5);
  return format(dateOrString, 'HH:mm');
}

export function daysOfWeek(start: Date): Date[] {
  const end = addDays(start, 6);
  return eachDayOfInterval({ start, end });
}


