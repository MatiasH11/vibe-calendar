/**
 * Utilidades para manejo de formularios y normalización de datos
 */

import { utcTimeToLocal } from './timezone-client';

/**
 * Normaliza una fecha para input de tipo date
 * @param date - Fecha en formato string, Date o undefined
 * @returns Fecha en formato YYYY-MM-DD o string vacío
 */
export function normalizeDateForInput(date: string | Date | undefined): string {
  if (!date) return '';
  
  try {
    let dateToProcess: Date;
    
    if (typeof date === 'string') {
      // Si es fecha ISO, extraer solo la parte de fecha
      if (date.includes('T')) {
        dateToProcess = new Date(date);
      } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Ya está en formato correcto
        return date;
      } else {
        // Intentar parsear otros formatos
        dateToProcess = new Date(date);
      }
    } else {
      dateToProcess = date;
    }
    
    // Validar que la fecha es válida
    if (isNaN(dateToProcess.getTime())) {
      console.warn('Invalid date provided to normalizeDateForInput:', date);
      return '';
    }
    
    // Convertir a formato YYYY-MM-DD
    return dateToProcess.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error normalizing date for input:', error, date);
    return '';
  }
}

/**
 * Normaliza tiempo para input de tipo time
 * @param time - Tiempo en formato string, Date o undefined
 * @param convertFromUTC - Si true, convierte de UTC a hora local (para datos del servidor)
 * @returns Tiempo en formato HH:mm o string vacío
 */
export function normalizeTimeForInput(time: string | Date | undefined, convertFromUTC: boolean = false): string {
  if (!time) return '';
  
  try {
    if (typeof time === 'string') {
      // Si ya está en formato HH:mm
      if (time.match(/^\d{2}:\d{2}$/)) {
        if (convertFromUTC) {
          // Convertir de UTC a hora local usando la función de timezone
          return utcTimeToLocal(time, new Date());
        }
        return time;
      }
      
      // Si es formato ISO o incluye segundos
      if (time.includes('T') || time.includes(':')) {
        const date = new Date(time);
        if (!isNaN(date.getTime())) {
          const timeStr = date.toTimeString().substring(0, 5);
          if (convertFromUTC) {
            return utcTimeToLocal(timeStr, date);
          }
          return timeStr;
        }
      }
    } else if (time instanceof Date) {
      const timeStr = time.toTimeString().substring(0, 5);
      if (convertFromUTC) {
        return utcTimeToLocal(timeStr, time);
      }
      return timeStr;
    }
    
    return '';
  } catch (error) {
    console.error('Error normalizing time for input:', error, time);
    return '';
  }
}

/**
 * Valida que los datos iniciales están completos para un formulario de turno
 * @param initialData - Datos iniciales del formulario
 * @returns true si los datos están completos
 */
export function validateInitialShiftData(initialData: any): boolean {
  if (!initialData || typeof initialData !== 'object') {
    return false;
  }
  
  // Para edición, debe tener al menos employee_id y shift_date
  const hasRequiredFields = initialData.company_employee_id !== undefined && 
                           initialData.shift_date !== undefined;
  
  return hasRequiredFields;
}

/**
 * Wrapper para operaciones con timeout
 * @param promise - Promise a ejecutar
 * @param timeoutMs - Timeout en milisegundos
 * @returns Promise con timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Debounce mejorado con cancelación
 * @param func - Función a ejecutar
 * @param delay - Delay en milisegundos
 * @returns Función debounced con método cancel
 */
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };
  
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debouncedFn;
}

/**
 * Estados de carga granulares para formularios
 */
export interface FormLoadingStates {
  initializing: boolean;
  validating: boolean;
  submitting: boolean;
  loadingTemplates: boolean;
  loadingSuggestions: boolean;
}

/**
 * Crea estados de carga iniciales
 * @returns Estados de carga por defecto
 */
export function createInitialLoadingStates(): FormLoadingStates {
  return {
    initializing: false,
    validating: false,
    submitting: false,
    loadingTemplates: false,
    loadingSuggestions: false,
  };
}

/**
 * Maneja errores de formulario de manera consistente
 * @param error - Error a procesar
 * @param context - Contexto del error
 * @returns Mensaje de error user-friendly
 */
export function handleFormError(error: unknown, context: string = 'form'): string {
  console.error(`Form error in ${context}:`, error);
  
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return 'La operación tardó demasiado tiempo. Por favor, inténtalo de nuevo.';
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }
    
    if (error.message.includes('validation')) {
      return 'Los datos ingresados no son válidos. Revisa los campos marcados.';
    }
    
    return error.message;
  }
  
  return 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
}

/**
 * Valida formato de email
 * @param email - Email a validar
 * @returns true si es válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de tiempo HH:mm
 * @param time - Tiempo a validar
 * @returns true si es válido
 */
export function isValidTime(time: string): boolean {
  if (!time) return false;
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Valida formato de fecha YYYY-MM-DD
 * @param date - Fecha a validar
 * @returns true si es válida
 */
export function isValidDate(date: string): boolean {
  if (!date) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}

/**
 * Compara dos objetos de datos de formulario para detectar cambios
 * @param current - Datos actuales
 * @param previous - Datos anteriores
 * @returns true si hay cambios
 */
export function hasFormDataChanged(current: any, previous: any): boolean {
  if (!current && !previous) return false;
  if (!current || !previous) return true;
  
  const currentKeys = Object.keys(current);
  const previousKeys = Object.keys(previous);
  
  if (currentKeys.length !== previousKeys.length) return true;
  
  return currentKeys.some(key => current[key] !== previous[key]);
}
