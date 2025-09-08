/**
 * Utilidades para manejo de zona horaria del cliente
 * Solución flexible que funciona con cualquier zona horaria
 */

/**
 * Obtiene la zona horaria del cliente automáticamente
 */
export function getClientTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convierte tiempo local a UTC usando la zona horaria del cliente
 * @param localTime - Hora en formato HH:mm (ej: "17:00")
 * @param date - Fecha base para la conversión
 * @param timezone - Zona horaria del cliente (opcional, se detecta automáticamente)
 * @returns Hora en formato HH:mm UTC
 */
export function localTimeToUTC(
  localTime: string, 
  date: Date, 
  timezone?: string
): string {
  try {
    const clientTimezone = timezone || getClientTimezone();
    const [hours, minutes] = localTime.split(':').map(Number);
    
    // Crear fecha en la zona horaria del cliente
    const localDateTime = new Date(date);
    localDateTime.setHours(hours, minutes, 0, 0);
    
    // Convertir a UTC
    const utcTime = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000);
    
    return utcTime.toISOString().substring(11, 16);
  } catch (error) {
    console.error('Error converting local time to UTC:', error);
    return localTime; // Fallback
  }
}

/**
 * Convierte tiempo UTC a local usando la zona horaria del cliente
 * @param utcTime - Hora en formato HH:mm UTC (ej: "20:00")
 * @param date - Fecha base para la conversión
 * @param timezone - Zona horaria del cliente (opcional, se detecta automáticamente)
 * @returns Hora en formato HH:mm local
 */
export function utcTimeToLocal(
  utcTime: string, 
  date: Date, 
  timezone?: string
): string {
  try {
    const clientTimezone = timezone || getClientTimezone();
    const [hours, minutes] = utcTime.split(':').map(Number);
    
    // Crear fecha UTC
    const utcDateTime = new Date(date);
    utcDateTime.setUTCHours(hours, minutes, 0, 0);
    
    // Convertir a hora local
    const localTime = new Date(utcDateTime.getTime() + utcDateTime.getTimezoneOffset() * 60000);
    
    return localTime.toTimeString().substring(0, 5);
  } catch (error) {
    console.error('Error converting UTC time to local:', error);
    return utcTime; // Fallback
  }
}

/**
 * Formatea tiempo de manera segura, manejando diferentes formatos
 * @param time - Tiempo en formato string o Date
 * @param timezone - Zona horaria del cliente (opcional, se detecta automáticamente)
 * @returns Tiempo formateado en HH:mm local
 */
export function formatTimeSafe(time: string | Date, timezone?: string): string {
  try {
    if (typeof time === 'string') {
      if (time.match(/^\d{2}:\d{2}$/)) {
        // Es formato HH:mm, asumir que es UTC y convertir a local
        return utcTimeToLocal(time, new Date(), timezone);
      } else if (time.includes('T') && time.includes('Z')) {
        // Es formato ISO, extraer solo la hora y convertir a local
        const date = new Date(time);
        const utcTime = date.toISOString().substring(11, 16);
        return utcTimeToLocal(utcTime, date, timezone);
      } else {
        // Formato desconocido, devolver tal como está
        return time;
      }
    } else if (time instanceof Date) {
      // Es Date, extraer la hora y convertir a local
      const utcTime = time.toISOString().substring(11, 16);
      return utcTimeToLocal(utcTime, time, timezone);
    }
    return '--:--';
  } catch (error) {
    console.error('Error formatting time safely:', error, time);
    return '--:--';
  }
}

/**
 * Debug: muestra información de zona horaria del cliente
 */
export function debugClientTimezone(): void {
  const timezone = getClientTimezone();
  const now = new Date();
  
  console.log('🌍 Información de zona horaria del cliente:');
  console.log('- Zona horaria:', timezone);
  console.log('- Offset en minutos:', now.getTimezoneOffset());
  console.log('- Offset en horas:', now.getTimezoneOffset() / 60);
  console.log('- Hora local actual:', now.toTimeString().substring(0, 5));
  console.log('- Hora UTC actual:', now.toISOString().substring(11, 16));
  
  // Ejemplo de conversión
  const testTime = '17:00';
  const testDate = new Date();
  const utcTime = localTimeToUTC(testTime, testDate, timezone);
  const backToLocal = utcTimeToLocal(utcTime, testDate, timezone);
  
  console.log('- Ejemplo de conversión:');
  console.log(`  ${testTime} local → ${utcTime} UTC → ${backToLocal} local`);
}
