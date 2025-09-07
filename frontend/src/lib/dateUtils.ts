import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date: Date, formatStr: string = 'dd/MM/yyyy') => {
  return format(date, formatStr, { locale: es });
};

export const formatTime = (date: Date) => {
  return format(date, 'HH:mm');
};

export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Lunes
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const getWeekRange = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
};

export const navigateWeek = (currentDate: Date, direction: 'prev' | 'next') => {
  return direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
};
