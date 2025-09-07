// Script para probar el formato de tiempo
console.log('🧪 Probando formato de tiempo...\n');

// Simular diferentes formatos que pueden llegar del backend
const testTimes = [
  '20:00', // Formato HH:mm directo
  '22:00', // Formato HH:mm directo
  '1970-01-01T20:00:00.000Z', // Formato ISO completo
  '1970-01-01T22:00:00.000Z', // Formato ISO completo
  new Date('1970-01-01T20:00:00.000Z'), // Objeto Date
  new Date('1970-01-01T22:00:00.000Z'), // Objeto Date
];

// Función de formateo similar a la del frontend
function formatShiftTime(time) {
  try {
    if (typeof time === 'string') {
      // Si es string, verificar si es formato ISO o HH:mm
      if (time.includes('T') && time.includes('Z')) {
        // Es formato ISO, extraer solo la parte de tiempo
        const date = new Date(time);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      } else {
        // Es formato HH:mm directo
        return time;
      }
    } else if (time instanceof Date) {
      // Si es Date, extraer la parte de tiempo
      return time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return '--:--';
  } catch (error) {
    console.error('Error formatting time:', error, time);
    return '--:--';
  }
}

console.log('📋 Resultados del formateo:');
testTimes.forEach((time, index) => {
  const formatted = formatShiftTime(time);
  console.log(`${index + 1}. ${time} → ${formatted}`);
});

console.log('\n✅ Prueba completada');
