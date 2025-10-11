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

/**
 * Normaliza una fecha para uso en formularios
 * Maneja diferentes formatos de entrada de manera segura
 * @param date - Fecha en formato string, Date o undefined
 * @returns Fecha en formato YYYY-MM-DD o string vacío
 */
export function normalizeDateForForm(date: string | Date | undefined): string {
  if (!date) return '';
  
  try {
    let dateToProcess: Date;
    
    if (typeof date === 'string') {
      // Si es fecha ISO, extraer solo la parte de fecha
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      
      // Si ya está en formato YYYY-MM-DD
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
      
      // Intentar parsear otros formatos
      dateToProcess = new Date(date);
    } else {
      dateToProcess = date;
    }
    
    // Validar que la fecha es válida
    if (isNaN(dateToProcess.getTime())) {
      console.warn('Invalid date provided to normalizeDateForForm:', date);
      return '';
    }
    
    // Convertir a formato YYYY-MM-DD
    return dateToProcess.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error normalizing date for form:', error, date);
    return '';
  }
}

/**
 * Valida si una fecha está en formato válido
 * @param date - Fecha a validar
 * @returns true si es válida
 */
export function isValidDateString(date: string): boolean {
  if (!date) return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}
