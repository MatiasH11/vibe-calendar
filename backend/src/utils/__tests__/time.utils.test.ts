import {
  parseUTCTime,
  validateTimeFormat,
  formatTimeToUTC,
  parseISODate,
  validateDateFormat,
  formatDateToISO,
  calculateDuration,
  isValidTimeRange,
  isOvernightShift,
} from '../time.utils';

describe('Time Utilities - UTC Time Handling', () => {
  describe('validateTimeFormat', () => {
    it('should accept valid UTC time formats', () => {
      expect(validateTimeFormat('00:00')).toBe(true);
      expect(validateTimeFormat('09:00')).toBe(true);
      expect(validateTimeFormat('14:30')).toBe(true);
      expect(validateTimeFormat('23:59')).toBe(true);
      expect(validateTimeFormat('12:00')).toBe(true);
    });

    it('should reject invalid time formats', () => {
      expect(validateTimeFormat('24:00')).toBe(false); // Invalid hour
      expect(validateTimeFormat('9:00')).toBe(false); // Missing leading zero
      expect(validateTimeFormat('09:60')).toBe(false); // Invalid minute
      expect(validateTimeFormat('09:5')).toBe(false); // Missing trailing zero
      expect(validateTimeFormat('9:5')).toBe(false); // Missing both zeros
      expect(validateTimeFormat('09')).toBe(false); // Missing minutes
      expect(validateTimeFormat('09:00:00')).toBe(false); // Has seconds
    });

    it('should reject timezone information', () => {
      expect(validateTimeFormat('09:00Z')).toBe(false);
      expect(validateTimeFormat('09:00+00:00')).toBe(false);
      expect(validateTimeFormat('09:00-05:00')).toBe(false);
      expect(validateTimeFormat('09:00 UTC')).toBe(false);
    });

    it('should reject empty or malformed strings', () => {
      expect(validateTimeFormat('')).toBe(false);
      expect(validateTimeFormat('invalid')).toBe(false);
      expect(validateTimeFormat('25:00')).toBe(false);
      expect(validateTimeFormat('-01:00')).toBe(false);
    });
  });

  describe('parseUTCTime', () => {
    it('should parse valid UTC time strings to Date objects', () => {
      const result1 = parseUTCTime('09:00');
      expect(result1).toBeInstanceOf(Date);
      expect(result1.getHours()).toBe(9);
      expect(result1.getMinutes()).toBe(0);

      const result2 = parseUTCTime('14:30');
      expect(result2.getHours()).toBe(14);
      expect(result2.getMinutes()).toBe(30);

      const result3 = parseUTCTime('23:59');
      expect(result3.getHours()).toBe(23);
      expect(result3.getMinutes()).toBe(59);
    });

    it('should throw error for invalid time formats', () => {
      expect(() => parseUTCTime('25:00')).toThrow('Invalid UTC time format');
      expect(() => parseUTCTime('9:00')).toThrow('Invalid UTC time format');
      expect(() => parseUTCTime('09:60')).toThrow('Invalid UTC time format');
      expect(() => parseUTCTime('09:00Z')).toThrow('Invalid UTC time format');
      expect(() => parseUTCTime('')).toThrow('Invalid UTC time format');
    });
  });

  describe('formatTimeToUTC', () => {
    it('should format Date objects to HH:mm strings', () => {
      const date1 = new Date(2025, 9, 26, 9, 0, 0);
      expect(formatTimeToUTC(date1)).toBe('09:00');

      const date2 = new Date(2025, 9, 26, 14, 30, 0);
      expect(formatTimeToUTC(date2)).toBe('14:30');

      const date3 = new Date(2025, 9, 26, 0, 0, 0);
      expect(formatTimeToUTC(date3)).toBe('00:00');

      const date4 = new Date(2025, 9, 26, 23, 59, 0);
      expect(formatTimeToUTC(date4)).toBe('23:59');
    });

    it('should handle edge cases', () => {
      const midnight = new Date(2025, 0, 1, 0, 0, 0);
      expect(formatTimeToUTC(midnight)).toBe('00:00');

      const lastMinute = new Date(2025, 0, 1, 23, 59, 59);
      expect(formatTimeToUTC(lastMinute)).toBe('23:59');
    });
  });

  describe('Round-trip conversion', () => {
    it('should correctly convert time string -> Date -> time string', () => {
      const times = ['00:00', '09:00', '14:30', '17:00', '23:59'];

      times.forEach(time => {
        const date = parseUTCTime(time);
        const formatted = formatTimeToUTC(date);
        expect(formatted).toBe(time);
      });
    });
  });
});

describe('Time Utilities - ISO Date Handling', () => {
  describe('validateDateFormat', () => {
    it('should accept valid ISO date formats', () => {
      expect(validateDateFormat('2025-10-26')).toBe(true);
      expect(validateDateFormat('2025-01-01')).toBe(true);
      expect(validateDateFormat('2025-12-31')).toBe(true);
      expect(validateDateFormat('2000-02-29')).toBe(true); // Leap year
    });

    it('should reject invalid date formats', () => {
      expect(validateDateFormat('2025-13-01')).toBe(false); // Invalid month
      expect(validateDateFormat('2025-00-01')).toBe(false); // Invalid month
      expect(validateDateFormat('2025-01-32')).toBe(false); // Invalid day
      expect(validateDateFormat('2025-01-00')).toBe(false); // Invalid day
      expect(validateDateFormat('2025-1-1')).toBe(false); // Missing leading zeros
      expect(validateDateFormat('25-01-01')).toBe(false); // Invalid year
    });

    it('should reject dates with time components', () => {
      expect(validateDateFormat('2025-10-26T09:00:00')).toBe(false);
      expect(validateDateFormat('2025-10-26 09:00:00')).toBe(false);
      expect(validateDateFormat('2025-10-26T09:00:00Z')).toBe(false);
    });

    it('should reject empty or malformed strings', () => {
      expect(validateDateFormat('')).toBe(false);
      expect(validateDateFormat('invalid')).toBe(false);
      expect(validateDateFormat('2025/10/26')).toBe(false);
      expect(validateDateFormat('26-10-2025')).toBe(false);
    });
  });

  describe('parseISODate', () => {
    it('should parse valid ISO date strings to Date objects', () => {
      const result1 = parseISODate('2025-10-26');
      expect(result1).toBeInstanceOf(Date);
      expect(result1.getFullYear()).toBe(2025);
      expect(result1.getMonth()).toBe(9); // October (0-indexed)
      expect(result1.getDate()).toBe(26);

      const result2 = parseISODate('2025-01-01');
      expect(result2.getFullYear()).toBe(2025);
      expect(result2.getMonth()).toBe(0);
      expect(result2.getDate()).toBe(1);
    });

    it('should throw error for invalid date formats', () => {
      expect(() => parseISODate('2025-13-01')).toThrow('Invalid ISO date format');
      expect(() => parseISODate('2025-01-32')).toThrow('Invalid ISO date format');
      expect(() => parseISODate('2025-1-1')).toThrow('Invalid ISO date format');
      expect(() => parseISODate('')).toThrow('Invalid ISO date format');
    });
  });

  describe('formatDateToISO', () => {
    it('should format Date objects to ISO YYYY-MM-DD strings', () => {
      const date1 = new Date(2025, 9, 26);
      expect(formatDateToISO(date1)).toBe('2025-10-26');

      const date2 = new Date(2025, 0, 1);
      expect(formatDateToISO(date2)).toBe('2025-01-01');

      const date3 = new Date(2025, 11, 31);
      expect(formatDateToISO(date3)).toBe('2025-12-31');
    });

    it('should handle edge cases', () => {
      const jan1 = new Date(2025, 0, 1);
      expect(formatDateToISO(jan1)).toBe('2025-01-01');

      const dec31 = new Date(2025, 11, 31);
      expect(formatDateToISO(dec31)).toBe('2025-12-31');
    });
  });

  describe('Round-trip conversion', () => {
    it('should correctly convert date string -> Date -> date string', () => {
      const dates = ['2025-01-01', '2025-10-26', '2025-12-31', '2000-02-29'];

      dates.forEach(date => {
        const dateObj = parseISODate(date);
        const formatted = formatDateToISO(dateObj);
        expect(formatted).toBe(date);
      });
    });
  });
});

describe('Time Utilities - Duration and Range Calculations', () => {
  describe('calculateDuration', () => {
    it('should calculate duration for normal shifts (same day)', () => {
      expect(calculateDuration('09:00', '17:00')).toBe(8);
      expect(calculateDuration('08:00', '16:30')).toBe(8.5);
      expect(calculateDuration('10:00', '14:00')).toBe(4);
      expect(calculateDuration('00:00', '12:00')).toBe(12);
    });

    it('should calculate duration for overnight shifts', () => {
      expect(calculateDuration('22:00', '06:00')).toBe(8);
      expect(calculateDuration('20:00', '04:00')).toBe(8);
      expect(calculateDuration('23:00', '07:00')).toBe(8);
      expect(calculateDuration('18:00', '02:00')).toBe(8);
    });

    it('should handle edge cases', () => {
      expect(calculateDuration('00:00', '23:59')).toBeCloseTo(23.983, 2);
      expect(calculateDuration('12:00', '12:30')).toBe(0.5);
      expect(calculateDuration('09:15', '17:45')).toBe(8.5);
    });

    it('should return 0 for equal start and end times', () => {
      expect(calculateDuration('09:00', '09:00')).toBe(0);
      expect(calculateDuration('00:00', '00:00')).toBe(0);
    });
  });

  describe('isOvernightShift', () => {
    it('should return true for overnight shifts', () => {
      expect(isOvernightShift('22:00', '06:00')).toBe(true);
      expect(isOvernightShift('20:00', '04:00')).toBe(true);
      expect(isOvernightShift('23:59', '00:01')).toBe(true);
    });

    it('should return false for same-day shifts', () => {
      expect(isOvernightShift('09:00', '17:00')).toBe(false);
      expect(isOvernightShift('08:00', '16:30')).toBe(false);
      expect(isOvernightShift('00:00', '12:00')).toBe(false);
    });

    it('should return false for equal times', () => {
      expect(isOvernightShift('09:00', '09:00')).toBe(false);
      expect(isOvernightShift('00:00', '00:00')).toBe(false);
    });
  });

  describe('isValidTimeRange', () => {
    it('should return true for valid time ranges', () => {
      expect(isValidTimeRange('09:00', '17:00')).toBe(true);
      expect(isValidTimeRange('22:00', '06:00')).toBe(true); // Overnight
      expect(isValidTimeRange('00:00', '23:59')).toBe(true);
    });

    it('should return false for equal times', () => {
      expect(isValidTimeRange('09:00', '09:00')).toBe(false);
      expect(isValidTimeRange('00:00', '00:00')).toBe(false);
      expect(isValidTimeRange('14:30', '14:30')).toBe(false);
    });

    it('should return false for invalid time formats', () => {
      expect(isValidTimeRange('25:00', '17:00')).toBe(false);
      expect(isValidTimeRange('09:00', '9:00')).toBe(false);
      expect(isValidTimeRange('09:60', '17:00')).toBe(false);
    });
  });
});

describe('Time Utilities - Timezone Rejection', () => {
  it('should reject all timezone indicators in time strings', () => {
    const invalidTimes = [
      '09:00Z',
      '09:00+00:00',
      '09:00-05:00',
      '09:00+01:00',
      '09:00 UTC',
      '09:00 GMT',
      '14:30Z',
      '14:30+00:00',
    ];

    invalidTimes.forEach(time => {
      expect(validateTimeFormat(time)).toBe(false);
      expect(() => parseUTCTime(time)).toThrow('Invalid UTC time format');
    });
  });

  it('should reject timezone indicators in date strings', () => {
    const invalidDates = [
      '2025-10-26T00:00:00Z',
      '2025-10-26T00:00:00+00:00',
      '2025-10-26T09:00:00',
      '2025-10-26 09:00:00',
    ];

    invalidDates.forEach(date => {
      expect(validateDateFormat(date)).toBe(false);
      expect(() => parseISODate(date)).toThrow('Invalid ISO date format');
    });
  });
});

describe('Time Utilities - Edge Cases and Error Handling', () => {
  it('should handle midnight correctly', () => {
    expect(validateTimeFormat('00:00')).toBe(true);
    const midnight = parseUTCTime('00:00');
    expect(midnight.getHours()).toBe(0);
    expect(midnight.getMinutes()).toBe(0);
    expect(formatTimeToUTC(midnight)).toBe('00:00');
  });

  it('should handle end of day correctly', () => {
    expect(validateTimeFormat('23:59')).toBe(true);
    const endOfDay = parseUTCTime('23:59');
    expect(endOfDay.getHours()).toBe(23);
    expect(endOfDay.getMinutes()).toBe(59);
    expect(formatTimeToUTC(endOfDay)).toBe('23:59');
  });

  it('should handle leap year dates', () => {
    expect(validateDateFormat('2024-02-29')).toBe(true); // Leap year
    expect(validateDateFormat('2025-02-29')).toBe(false); // Not a leap year
  });

  it('should throw descriptive errors', () => {
    expect(() => parseUTCTime('invalid')).toThrow(/Invalid UTC time format/);
    expect(() => parseISODate('invalid')).toThrow(/Invalid ISO date format/);
  });
});
