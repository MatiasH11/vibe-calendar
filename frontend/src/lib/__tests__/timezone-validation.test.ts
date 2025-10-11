/**
 * Tests de validación para las conversiones de timezone con date-fns-tz
 */

import { localTimeToUTC, utcTimeToLocal, formatTimeSafe, getClientTimezone } from '../timezone-client';

describe('Timezone Conversions with date-fns-tz', () => {
  const testDate = new Date('2024-01-15'); // Fecha fija para pruebas
  const argentinaTimezone = 'America/Argentina/Buenos_Aires'; // UTC-3

  describe('localTimeToUTC', () => {
    it('should convert local time to UTC correctly for Argentina timezone', () => {
      // 15:00 local en Argentina (-03:00) debería ser 18:00 UTC
      const result = localTimeToUTC('15:00', testDate, argentinaTimezone);
      expect(result).toBe('18:00');
    });

    it('should convert midnight local to UTC correctly', () => {
      // 00:00 local en Argentina (-03:00) debería ser 03:00 UTC
      const result = localTimeToUTC('00:00', testDate, argentinaTimezone);
      expect(result).toBe('03:00');
    });

    it('should handle edge case near day boundary', () => {
      // 23:00 local en Argentina (-03:00) debería ser 02:00 UTC del día siguiente
      const result = localTimeToUTC('23:00', testDate, argentinaTimezone);
      expect(result).toBe('02:00');
    });
  });

  describe('utcTimeToLocal', () => {
    it('should convert UTC time to local correctly for Argentina timezone', () => {
      // 18:00 UTC debería ser 15:00 local en Argentina (-03:00)
      const result = utcTimeToLocal('18:00', testDate, argentinaTimezone);
      expect(result).toBe('15:00');
    });

    it('should convert UTC midnight to local correctly', () => {
      // 03:00 UTC debería ser 00:00 local en Argentina (-03:00)
      const result = utcTimeToLocal('03:00', testDate, argentinaTimezone);
      expect(result).toBe('00:00');
    });

    it('should handle edge case near day boundary', () => {
      // 02:00 UTC debería ser 23:00 local del día anterior en Argentina (-03:00)
      const result = utcTimeToLocal('02:00', testDate, argentinaTimezone);
      expect(result).toBe('23:00');
    });
  });

  describe('Round-trip conversions', () => {
    it('should maintain consistency in round-trip conversions', () => {
      const originalTime = '14:30';
      
      // Local → UTC → Local debería devolver el tiempo original
      const utcTime = localTimeToUTC(originalTime, testDate, argentinaTimezone);
      const backToLocal = utcTimeToLocal(utcTime, testDate, argentinaTimezone);
      
      expect(backToLocal).toBe(originalTime);
    });

    it('should handle multiple round-trip conversions', () => {
      const testTimes = ['00:00', '06:00', '12:00', '18:00', '23:59'];
      
      testTimes.forEach(time => {
        const utcTime = localTimeToUTC(time, testDate, argentinaTimezone);
        const backToLocal = utcTimeToLocal(utcTime, testDate, argentinaTimezone);
        expect(backToLocal).toBe(time);
      });
    });
  });

  describe('formatTimeSafe', () => {
    it('should format HH:mm UTC string to local time', () => {
      // 18:00 UTC debería mostrarse como 15:00 local en Argentina
      const result = formatTimeSafe('18:00', argentinaTimezone);
      expect(result).toBe('15:00');
    });

    it('should format Date object to local time', () => {
      const utcDate = new Date('2024-01-15T18:00:00.000Z');
      const result = formatTimeSafe(utcDate, argentinaTimezone);
      expect(result).toBe('15:00');
    });

    it('should handle ISO string format', () => {
      const isoString = '2024-01-15T18:00:00.000Z';
      const result = formatTimeSafe(isoString, argentinaTimezone);
      expect(result).toBe('15:00');
    });

    it('should return fallback for invalid input', () => {
      const result = formatTimeSafe('invalid-time', argentinaTimezone);
      expect(result).toBe('invalid-time'); // Formato desconocido se devuelve tal como está
    });
  });

  describe('getClientTimezone', () => {
    it('should return a valid timezone string', () => {
      const timezone = getClientTimezone();
      expect(typeof timezone).toBe('string');
      expect(timezone.length).toBeGreaterThan(0);
      // Debería ser un timezone válido como 'America/Argentina/Buenos_Aires'
      expect(timezone).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+/);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid time format gracefully', () => {
      expect(() => localTimeToUTC('25:00', testDate, argentinaTimezone)).not.toThrow();
      expect(() => utcTimeToLocal('invalid', testDate, argentinaTimezone)).not.toThrow();
    });

    it('should return fallback values on error', () => {
      const invalidTime = '25:00';
      const localResult = localTimeToUTC(invalidTime, testDate, argentinaTimezone);
      const utcResult = utcTimeToLocal(invalidTime, testDate, argentinaTimezone);
      
      // Deberían devolver el tiempo original como fallback
      expect(localResult).toBe(invalidTime);
      expect(utcResult).toBe(invalidTime);
    });
  });
});
