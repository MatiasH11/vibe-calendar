/**
 * Time Conversion Utilities
 * Centralized functions for converting between UTC time strings and DateTime objects
 */

/**
 * Validates time format (HH:MM)
 * @param time - Time string to validate
 * @returns true if valid HH:MM format
 */
export function validateTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

/**
 * Converts UTC time string (HH:MM) to DateTime object
 * @param utcTime - Time in HH:MM format (e.g., "09:00")
 * @returns Date object representing the time
 * @throws Error if time format is invalid
 */
export function utcTimeToDateTime(utcTime: string): Date {
  if (!validateTimeFormat(utcTime)) {
    throw new Error('INVALID_TIME_FORMAT');
  }
  return new Date(`1970-01-01T${utcTime}:00.000Z`);
}

/**
 * Converts DateTime object to UTC time string (HH:MM)
 * @param dateTime - Date object
 * @returns Time string in HH:MM format
 */
export function dateTimeToUtcTime(dateTime: Date): string {
  return dateTime.toISOString().substring(11, 16);
}

/**
 * Calculates duration in minutes between two time strings
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Duration in minutes
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

/**
 * Checks if two time ranges overlap
 * @param start1 - First range start time (HH:MM)
 * @param end1 - First range end time (HH:MM)
 * @param start2 - Second range start time (HH:MM)
 * @param end2 - Second range end time (HH:MM)
 * @returns true if ranges overlap
 */
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && start2 < end1;
}
