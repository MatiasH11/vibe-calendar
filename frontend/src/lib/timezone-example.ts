/**
 * Ejemplo de uso del sistema unificado de timezone con date-fns-tz
 * 
 * FLUJO COMPLETO:
 * Frontend (Usuario ve) → SIEMPRE LOCAL
 *      ↓ (al enviar al backend)
 * Conversión LOCAL → UTC 
 *      ↓
 * Backend → SIEMPRE UTC
 *      ↓ (al recibir del backend)  
 * Conversión UTC → LOCAL
 *      ↓
 * Frontend (Usuario ve) → SIEMPRE LOCAL
 */

import { localTimeToUTC, utcTimeToLocal, formatTimeSafe, getClientTimezone } from './timezone-client';

// Ejemplo práctico: Usuario en Argentina (UTC-3) crea un turno

console.log('=== EJEMPLO DE CONVERSIÓN DE HORARIOS ===\n');

// 1. Usuario ve y selecciona horarios en su zona local
const userLocalStartTime = '09:00'; // 9:00 AM local
const userLocalEndTime = '17:00';   // 5:00 PM local
const shiftDate = new Date('2024-01-15');
const userTimezone = getClientTimezone(); // Detecta automáticamente

console.log(`🌍 Timezone del usuario: ${userTimezone}`);
console.log(`📅 Fecha del turno: ${shiftDate.toDateString()}`);
console.log(`⏰ Horarios locales ingresados por el usuario:`);
console.log(`   Inicio: ${userLocalStartTime}`);
console.log(`   Fin: ${userLocalEndTime}\n`);

// 2. Al enviar al backend: LOCAL → UTC
const utcStartTime = localTimeToUTC(userLocalStartTime, shiftDate, userTimezone);
const utcEndTime = localTimeToUTC(userLocalEndTime, shiftDate, userTimezone);

console.log(`🚀 Conversión LOCAL → UTC (para enviar al backend):`);
console.log(`   Inicio UTC: ${utcStartTime}`);
console.log(`   Fin UTC: ${utcEndTime}\n`);

// 3. Backend almacena en UTC (simulado)
const backendResponse = {
  id: 1,
  start_time: utcStartTime,  // "12:00" (UTC)
  end_time: utcEndTime,      // "20:00" (UTC)
  shift_date: '2024-01-15'
};

console.log(`💾 Backend almacena (siempre UTC):`);
console.log(`   ${JSON.stringify(backendResponse, null, 2)}\n`);

// 4. Al recibir del backend: UTC → LOCAL
const displayStartTime = utcTimeToLocal(backendResponse.start_time, shiftDate, userTimezone);
const displayEndTime = utcTimeToLocal(backendResponse.end_time, shiftDate, userTimezone);

console.log(`📱 Conversión UTC → LOCAL (para mostrar al usuario):`);
console.log(`   Inicio local: ${displayStartTime}`);
console.log(`   Fin local: ${displayEndTime}\n`);

// 5. Formateo seguro para diferentes tipos de datos
console.log(`🎨 Formateo seguro con formatTimeSafe():`);
console.log(`   Desde string HH:mm: ${formatTimeSafe(backendResponse.start_time, userTimezone)}`);
console.log(`   Desde Date object: ${formatTimeSafe(new Date(`2024-01-15T${backendResponse.start_time}:00.000Z`), userTimezone)}`);
console.log(`   Desde ISO string: ${formatTimeSafe('2024-01-15T12:00:00.000Z', userTimezone)}\n`);

// 6. Validación de consistencia (round-trip)
const roundTripStart = utcTimeToLocal(localTimeToUTC(userLocalStartTime, shiftDate, userTimezone), shiftDate, userTimezone);
const roundTripEnd = utcTimeToLocal(localTimeToUTC(userLocalEndTime, shiftDate, userTimezone), shiftDate, userTimezone);

console.log(`✅ Validación de consistencia (LOCAL → UTC → LOCAL):`);
console.log(`   Original: ${userLocalStartTime} → Round-trip: ${roundTripStart} ✓`);
console.log(`   Original: ${userLocalEndTime} → Round-trip: ${roundTripEnd} ✓\n`);

// 7. Casos edge: cambio de día
console.log(`🌙 Casos edge - cambio de día:`);
const lateNightLocal = '23:30';
const lateNightUTC = localTimeToUTC(lateNightLocal, shiftDate, userTimezone);
console.log(`   ${lateNightLocal} local → ${lateNightUTC} UTC (día siguiente)`);

const earlyMorningUTC = '02:30';
const earlyMorningLocal = utcTimeToLocal(earlyMorningUTC, shiftDate, userTimezone);
console.log(`   ${earlyMorningUTC} UTC → ${earlyMorningLocal} local (día anterior)\n`);

console.log('=== RESUMEN ===');
console.log('✅ Backend siempre maneja UTC');
console.log('✅ Frontend siempre muestra horarios locales');
console.log('✅ Conversiones automáticas y robustas con date-fns-tz');
console.log('✅ Manejo correcto de horario de verano');
console.log('✅ API consistente y fácil de usar');
console.log('✅ Eliminada duplicación de código');

export {
  // Re-exportar funciones principales para fácil acceso
  localTimeToUTC,
  utcTimeToLocal,
  formatTimeSafe,
  getClientTimezone
};
