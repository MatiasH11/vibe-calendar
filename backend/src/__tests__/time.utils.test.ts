/**
 * Time Utils Tests - UTC Time Handling
 * Reference: PLAN.md Section 4.4
 *
 * Tests for pure UTC time functions (no timezone conversions)
 */

import {
  validateUTCTimeFormat,
  toUTCDateTime,
  fromUTCDateTime,
  compareUTCTimes,
  utcTimesOverlap,
  isTimeInRange,
  calculateDurationMinutes,
  isValidTimeRange,
  formatDuration,
} from '../utils/time.utils';

describe('Time Utils - UTC Time Handling (PLAN.md 4.4)', () => {
  describe('validateUTCTimeFormat', () => {
    it('should validate correct HH:mm format', () => {
      expect(validateUTCTimeFormat('00:00')).toBe(true);
      expect(validateUTCTimeFormat('09:00')).toBe(true);
      expect(validateUTCTimeFormat('14:30')).toBe(true);
      expect(validateUTCTimeFormat('23:59')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateUTCTimeFormat('9:00')).toBe(false); // Missing leading zero
      expect(validateUTCTimeFormat('14:30:00')).toBe(false); // With seconds
      expect(validateUTCTimeFormat('25:00')).toBe(false); // Invalid hour
      expect(validateUTCTimeFormat('14:60')).toBe(false); // Invalid minute
      expect(validateUTCTimeFormat('14:30+00:00')).toBe(false); // With timezone
      expect(validateUTCTimeFormat('14:30Z')).toBe(false); // With Z
      expect(validateUTCTimeFormat('')).toBe(false); // Empty string
      expect(validateUTCTimeFormat('not a time')).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(validateUTCTimeFormat(null as any)).toBe(false);
      expect(validateUTCTimeFormat(undefined as any)).toBe(false);
      expect(validateUTCTimeFormat(123 as any)).toBe(false);
    });
  });

  describe('toUTCDateTime', () => {
    it('should convert UTC time string to Date object', () => {
      const result = toUTCDateTime('09:00');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('1970-01-01T09:00:00.000Z');
    });

    it('should handle edge cases', () => {
      expect(toUTCDateTime('00:00').toISOString()).toBe('1970-01-01T00:00:00.000Z');
      expect(toUTCDateTime('23:59').toISOString()).toBe('1970-01-01T23:59:00.000Z');
      expect(toUTCDateTime('12:30').toISOString()).toBe('1970-01-01T12:30:00.000Z');
    });

    it('should throw error for invalid format', () => {
      expect(() => toUTCDateTime('9:00')).toThrow('Invalid UTC time format');
      expect(() => toUTCDateTime('25:00')).toThrow('Invalid UTC time format');
      expect(() => toUTCDateTime('14:30:00')).toThrow('Invalid UTC time format');
      expect(() => toUTCDateTime('')).toThrow('Invalid UTC time format');
    });
  });

  describe('fromUTCDateTime', () => {
    it('should convert Date object to UTC time string', () => {
      const date = new Date('1970-01-01T09:00:00.000Z');
      expect(fromUTCDateTime(date)).toBe('09:00');
    });

    it('should handle edge cases', () => {
      expect(fromUTCDateTime(new Date('1970-01-01T00:00:00.000Z'))).toBe('00:00');
      expect(fromUTCDateTime(new Date('1970-01-01T23:59:00.000Z'))).toBe('23:59');
      expect(fromUTCDateTime(new Date('1970-01-01T14:30:00.000Z'))).toBe('14:30');
    });

    it('should extract only HH:mm from any date', () => {
      // Date portion should be ignored, only time matters
      expect(fromUTCDateTime(new Date('2025-08-15T14:30:00.000Z'))).toBe('14:30');
      expect(fromUTCDateTime(new Date('1999-12-31T09:00:00.000Z'))).toBe('09:00');
    });
  });

  describe('compareUTCTimes', () => {
    it('should return -1 when time1 < time2', () => {
      expect(compareUTCTimes('09:00', '14:00')).toBe(-1);
      expect(compareUTCTimes('00:00', '23:59')).toBe(-1);
      expect(compareUTCTimes('14:00', '14:30')).toBe(-1);
    });

    it('should return 0 when times are equal', () => {
      expect(compareUTCTimes('09:00', '09:00')).toBe(0);
      expect(compareUTCTimes('14:30', '14:30')).toBe(0);
      expect(compareUTCTimes('00:00', '00:00')).toBe(0);
    });

    it('should return 1 when time1 > time2', () => {
      expect(compareUTCTimes('14:00', '09:00')).toBe(1);
      expect(compareUTCTimes('23:59', '00:00')).toBe(1);
      expect(compareUTCTimes('14:30', '14:00')).toBe(1);
    });
  });

  describe('utcTimesOverlap', () => {
    it('should detect overlapping ranges', () => {
      // Overlapping ranges
      expect(utcTimesOverlap('09:00', '17:00', '16:00', '20:00')).toBe(true);
      expect(utcTimesOverlap('09:00', '17:00', '10:00', '16:00')).toBe(true);
      expect(utcTimesOverlap('10:00', '16:00', '09:00', '17:00')).toBe(true);
      expect(utcTimesOverlap('09:00', '13:00', '12:00', '17:00')).toBe(true);
    });

    it('should NOT detect non-overlapping ranges', () => {
      // Adjacent but not overlapping (half-open intervals)
      expect(utcTimesOverlap('09:00', '13:00', '13:00', '17:00')).toBe(false);
      expect(utcTimesOverlap('08:00', '09:00', '09:00', '10:00')).toBe(false);

      // Completely separate
      expect(utcTimesOverlap('09:00', '13:00', '14:00', '18:00')).toBe(false);
      expect(utcTimesOverlap('14:00', '18:00', '09:00', '13:00')).toBe(false);
    });

    it('should handle edge cases', () => {
      // Same range
      expect(utcTimesOverlap('09:00', '17:00', '09:00', '17:00')).toBe(true);

      // One minute overlap
      expect(utcTimesOverlap('09:00', '13:01', '13:00', '17:00')).toBe(true);

      // Midnight ranges
      expect(utcTimesOverlap('00:00', '08:00', '07:00', '12:00')).toBe(true);
      expect(utcTimesOverlap('20:00', '23:59', '23:00', '23:59')).toBe(true);
    });
  });

  describe('isTimeInRange', () => {
    it('should return true when time is within range', () => {
      expect(isTimeInRange('14:00', '09:00', '17:00')).toBe(true);
      expect(isTimeInRange('09:00', '09:00', '17:00')).toBe(true); // Inclusive start
      expect(isTimeInRange('16:59', '09:00', '17:00')).toBe(true);
    });

    it('should return false when time is outside range', () => {
      expect(isTimeInRange('08:00', '09:00', '17:00')).toBe(false);
      expect(isTimeInRange('17:00', '09:00', '17:00')).toBe(false); // Exclusive end
      expect(isTimeInRange('17:01', '09:00', '17:00')).toBe(false);
    });
  });

  describe('calculateDurationMinutes', () => {
    it('should calculate duration correctly', () => {
      expect(calculateDurationMinutes('09:00', '17:00')).toBe(480); // 8 hours
      expect(calculateDurationMinutes('14:30', '16:45')).toBe(135); // 2h 15m
      expect(calculateDurationMinutes('00:00', '23:59')).toBe(1439); // Almost 24 hours
      expect(calculateDurationMinutes('09:00', '09:30')).toBe(30); // 30 minutes
    });

    it('should return 0 for same start and end time', () => {
      expect(calculateDurationMinutes('09:00', '09:00')).toBe(0);
    });

    it('should return negative for overnight shifts (end < start)', () => {
      // This is expected - caller should validate before calling
      expect(calculateDurationMinutes('23:00', '01:00')).toBe(-1320);
      expect(calculateDurationMinutes('17:00', '09:00')).toBe(-480);
    });
  });

  describe('isValidTimeRange', () => {
    it('should return true for valid ranges (end > start)', () => {
      expect(isValidTimeRange('09:00', '17:00')).toBe(true);
      expect(isValidTimeRange('00:00', '23:59')).toBe(true);
      expect(isValidTimeRange('14:00', '14:01')).toBe(true);
    });

    it('should return false for invalid ranges', () => {
      expect(isValidTimeRange('17:00', '09:00')).toBe(false); // Overnight
      expect(isValidTimeRange('14:00', '14:00')).toBe(false); // Same time
      expect(isValidTimeRange('23:59', '00:00')).toBe(false); // Overnight
    });
  });

  describe('formatDuration', () => {
    it('should format minutes correctly', () => {
      expect(formatDuration(480)).toBe('8h 0m');
      expect(formatDuration(135)).toBe('2h 15m');
      expect(formatDuration(45)).toBe('0h 45m');
      expect(formatDuration(60)).toBe('1h 0m');
      expect(formatDuration(0)).toBe('0h 0m');
    });

    it('should handle large durations', () => {
      expect(formatDuration(1440)).toBe('24h 0m');
      expect(formatDuration(1500)).toBe('25h 0m');
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain time value through conversion cycle', () => {
      const originalTime = '14:30';
      const dateTime = toUTCDateTime(originalTime);
      const convertedBack = fromUTCDateTime(dateTime);
      expect(convertedBack).toBe(originalTime);
    });

    it('should work for edge cases', () => {
      ['00:00', '12:00', '23:59'].forEach((time) => {
        const dateTime = toUTCDateTime(time);
        const convertedBack = fromUTCDateTime(dateTime);
        expect(convertedBack).toBe(time);
      });
    });
  });

  describe('Integration: Shift overlap detection', () => {
    it('should correctly detect overlapping shifts', () => {
      const shift1 = { start: '09:00', end: '17:00' };
      const shift2 = { start: '14:00', end: '20:00' };

      expect(utcTimesOverlap(shift1.start, shift1.end, shift2.start, shift2.end)).toBe(true);
    });

    it('should allow adjacent shifts (no overlap)', () => {
      const morningShift = { start: '09:00', end: '13:00' };
      const afternoonShift = { start: '13:00', end: '17:00' };

      expect(
        utcTimesOverlap(
          morningShift.start,
          morningShift.end,
          afternoonShift.start,
          afternoonShift.end
        )
      ).toBe(false);
    });

    it('should detect complete containment', () => {
      const outerShift = { start: '08:00', end: '18:00' };
      const innerShift = { start: '10:00', end: '16:00' };

      expect(
        utcTimesOverlap(outerShift.start, outerShift.end, innerShift.start, innerShift.end)
      ).toBe(true);
    });
  });

  describe('UTC Purity - No Timezone Handling', () => {
    it('should NOT attempt to convert timezones', () => {
      // These functions should work identically regardless of server timezone
      // They only manipulate UTC time strings, never considering local time

      const utcTime = '14:30';
      const dateTime = toUTCDateTime(utcTime);

      // The ISO string should ALWAYS be in UTC (Z suffix)
      expect(dateTime.toISOString()).toContain('Z');
      expect(dateTime.toISOString()).toBe('1970-01-01T14:30:00.000Z');

      // Converting back should give exact same time
      expect(fromUTCDateTime(dateTime)).toBe(utcTime);
    });
  });
});
