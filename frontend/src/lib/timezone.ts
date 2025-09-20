/**
 * Utilidades para manejo de zonas horarias
 */

/**
 * Obtiene la zona horaria local del usuario
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convierte una hora local (HH:mm) a UTC para enviar al backend
 * @param localTime - Hora en formato HH:mm (ej: "20:00")
 * @param date - Fecha base para la conversión (por defecto hoy)
 * @returns Hora en formato HH:mm UTC
 */
export function localTimeToUTC(localTime: string, date: Date = new Date()): string {
  try {
    // Crear una fecha con la hora local
    const [hours, minutes] = localTime.split(':').map(Number);
    const localDateTime = new Date(date);
    localDateTime.setHours(hours, minutes, 0, 0);
    
    
    // Convertir a UTC (restar el offset negativo para obtener UTC)
    // getTimezoneOffset() devuelve un valor negativo para zonas adelante de UTC
    const utcTime = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000);
    
    // Devolver en formato HH:mm
    const result = utcTime.toISOString().substring(11, 16);
    return result;
  } catch (error) {
    console.error('Error converting local time to UTC:', error);
    return localTime; // Fallback al tiempo original
  }
}

/**
 * Convierte una hora UTC (HH:mm) a hora local para mostrar
 * @param utcTime - Hora en formato HH:mm UTC (ej: "23:00")
 * @param date - Fecha base para la conversión (por defecto hoy)
 * @returns Hora en formato HH:mm local
 */
export function utcTimeToLocal(utcTime: string, date: Date = new Date()): string {
  try {
    // Crear una fecha UTC con la hora
    const [hours, minutes] = utcTime.split(':').map(Number);
    const utcDateTime = new Date(date);
    utcDateTime.setUTCHours(hours, minutes, 0, 0);
    
    
    // Convertir a hora local (sumar el offset negativo para obtener local)
    // getTimezoneOffset() devuelve un valor negativo para zonas adelante de UTC
    const localTime = new Date(utcDateTime.getTime() + utcDateTime.getTimezoneOffset() * 60000);
    
    // Devolver en formato HH:mm
    const result = localTime.toTimeString().substring(0, 5);
    return result;
  } catch (error) {
    console.error('Error converting UTC time to local:', error);
    return utcTime; // Fallback al tiempo original
  }
}

/**
 * Convierte un objeto Date a hora local (HH:mm)
 * @param date - Objeto Date
 * @returns Hora en formato HH:mm local
 */
export function dateToLocalTime(date: Date): string {
  return date.toTimeString().substring(0, 5);
}

/**
 * Convierte un objeto Date a hora UTC (HH:mm)
 * @param date - Objeto Date
 * @returns Hora en formato HH:mm UTC
 */
export function dateToUTCTime(date: Date): string {
  return date.toISOString().substring(11, 16);
}

/**
 * Crea un objeto Date con hora local
 * @param localTime - Hora en formato HH:mm (ej: "20:00")
 * @param date - Fecha base (por defecto hoy)
 * @returns Objeto Date con la hora local
 */
export function createLocalDateTime(localTime: string, date: Date = new Date()): Date {
  const [hours, minutes] = localTime.split(':').map(Number);
  const localDateTime = new Date(date);
  localDateTime.setHours(hours, minutes, 0, 0);
  return localDateTime;
}

/**
 * Crea un objeto Date con hora UTC
 * @param utcTime - Hora en formato HH:mm UTC (ej: "23:00")
 * @param date - Fecha base (por defecto hoy)
 * @returns Objeto Date con la hora UTC
 */
export function createUTCDateTime(utcTime: string, date: Date = new Date()): Date {
  const [hours, minutes] = utcTime.split(':').map(Number);
  const utcDateTime = new Date(date);
  utcDateTime.setUTCHours(hours, minutes, 0, 0);
  return utcDateTime;
}

/**
 * Formatea un tiempo de manera segura, manejando diferentes formatos
 * @param time - Tiempo en formato string o Date
 * @returns Tiempo formateado en HH:mm local
 */
export function formatTimeSafe(time: string | Date): string {
  try {
    if (typeof time === 'string') {
      if (time.match(/^\d{2}:\d{2}$/)) {
        // Es formato HH:mm, devolver tal como está (ya es local del backend)
        return time;
      } else if (time.includes('T') && time.includes('Z')) {
        // Es formato ISO, extraer solo la hora
        const date = new Date(time);
        return date.toTimeString().substring(0, 5);
      } else {
        // Formato desconocido, devolver tal como está
        return time;
      }
    } else if (time instanceof Date) {
      // Es Date, extraer la hora
      return time.toTimeString().substring(0, 5);
    }
    return '--:--';
  } catch (error) {
    console.error('Error formatting time safely:', error, time);
    return '--:--';
  }
}

