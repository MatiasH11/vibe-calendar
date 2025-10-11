/**
 * Script de prueba rápida para validar las conversiones de timezone
 * Ejecutar con: node src/lib/timezone-test.js
 */

// Simulación de las funciones sin date-fns-tz para testing rápido
function getClientTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function localTimeToUTCManual(localTime, date) {
  const [hours, minutes] = localTime.split(':').map(Number);
  const localDateTime = new Date(date);
  localDateTime.setHours(hours, minutes, 0, 0);
  
  // Conversión manual (será reemplazada por date-fns-tz)
  const utcTime = new Date(localDateTime.getTime() + localDateTime.getTimezoneOffset() * 60000);
  return utcTime.toISOString().substring(11, 16);
}

function utcTimeToLocalManual(utcTime, date) {
  const [hours, minutes] = utcTime.split(':').map(Number);
  const utcDateTime = new Date(date);
  utcDateTime.setUTCHours(hours, minutes, 0, 0);
  
  // Conversión manual (será reemplazada por date-fns-tz)
  const localTime = new Date(utcDateTime.getTime() - utcDateTime.getTimezoneOffset() * 60000);
  return localTime.toTimeString().substring(0, 5);
}

// Pruebas
console.log('=== PRUEBA DE CONVERSIONES DE TIMEZONE ===\n');

const testDate = new Date('2024-01-15');
const timezone = getClientTimezone();

console.log(`🌍 Timezone detectado: ${timezone}`);
console.log(`📅 Fecha de prueba: ${testDate.toDateString()}\n`);

// Test 1: Conversión LOCAL → UTC
const localTime = '15:00';
const utcTime = localTimeToUTCManual(localTime, testDate);
console.log(`🔄 LOCAL → UTC:`);
console.log(`   ${localTime} local → ${utcTime} UTC\n`);

// Test 2: Conversión UTC → LOCAL
const backToLocal = utcTimeToLocalManual(utcTime, testDate);
console.log(`🔄 UTC → LOCAL:`);
console.log(`   ${utcTime} UTC → ${backToLocal} local\n`);

// Test 3: Consistencia (round-trip)
const isConsistent = localTime === backToLocal;
console.log(`✅ Consistencia (round-trip):`);
console.log(`   Original: ${localTime} → Round-trip: ${backToLocal}`);
console.log(`   Consistente: ${isConsistent ? '✅ SÍ' : '❌ NO'}\n`);

// Test 4: Casos edge
console.log(`🌙 Casos edge:`);
const midnight = '00:00';
const midnightUTC = localTimeToUTCManual(midnight, testDate);
console.log(`   Medianoche local: ${midnight} → ${midnightUTC} UTC`);

const lateNight = '23:30';
const lateNightUTC = localTimeToUTCManual(lateNight, testDate);
console.log(`   Noche tardía: ${lateNight} → ${lateNightUTC} UTC\n`);

console.log('=== PRÓXIMOS PASOS ===');
console.log('1. Instalar dependencias: npm install date-fns date-fns-tz');
console.log('2. Las funciones en timezone-client.ts usarán date-fns-tz automáticamente');
console.log('3. Ejecutar tests completos: npm test timezone-validation.test.ts');
console.log('4. ¡El sistema estará listo para producción! 🚀');
