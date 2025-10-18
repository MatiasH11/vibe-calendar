/**
 * Time Utilities - Pure UTC Time Handling
 * Reference: PLAN.md Section 4.1
 *
 * PHILOSOPHY: Backend ONLY handles UTC. No timezone conversions. No adapters.
 * - Input: Frontend sends times in UTC format (HH:mm string)
 * - Processing: Backend works internally in UTC
 * - Storage: PostgreSQL Time (UTC)
 * - Output: Backend returns times in UTC format (HH:mm string)
 * - Frontend responsibility: Convert to/from user's timezone
 */

/**
 * Validates UTC time format (HH:mm)
 *
 * Valid: "09:00", "14:30", "23:59", "00:00"
 * Invalid: "9:00" (missing leading zero), "14:30:00" (with seconds), "25:00" (invalid hour)
 *
 * @param time - UTC time string to validate
 * @returns true if valid HH:mm format, false otherwise
 */
export function validateUTCTimeFormat(time: string): boolean {
  if (!time || typeof time !== 'string') {
    return false;
  }

  // Regex: exactly HH:mm format (no seconds)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

/**
 * Converts UTC time string (HH:mm) to PostgreSQL Time DateTime object
 *
 * Uses epoch date (1970-01-01) as PostgreSQL Time only stores time component.
 * The date part is irrelevant and will be stripped by Prisma.
 *
 * @param utcTimeString - UTC time in HH:mm format (e.g., "14:30")
 * @returns Date object for Prisma (only time component is used)
 * @throws Error if time format is invalid
 *
 * @example
 * toUTCDateTime("09:00") → Date 1970-01-01T09:00:00.000Z
 * toUTCDateTime("14:30") → Date 1970-01-01T14:30:00.000Z
 */
export function toUTCDateTime(utcTimeString: string): Date {
  if (!validateUTCTimeFormat(utcTimeString)) {
    throw new Error(`Invalid UTC time format: ${utcTimeString}. Expected HH:mm format.`);
  }

  // Use epoch date (1970-01-01) as base
  // PostgreSQL Time will only store the time component
  return new Date(`1970-01-01T${utcTimeString}:00.000Z`);
}

/**
 * Converts PostgreSQL Time DateTime object to UTC time string (HH:mm)
 *
 * Extracts only the time component from the Date object.
 *
 * @param dateTime - Date object from Prisma (contains time component)
 * @returns UTC time string in HH:mm format
 *
 * @example
 * fromUTCDateTime(new Date("1970-01-01T09:00:00.000Z")) → "09:00"
 * fromUTCDateTime(new Date("1970-01-01T14:30:00.000Z")) → "14:30"
 */
export function fromUTCDateTime(dateTime: Date): string {
  // Extract HH:mm from ISO string
  // ISO format: "1970-01-01T14:30:00.000Z"
  // We want: "14:30"
  return dateTime.toISOString().substring(11, 16);
}

/**
 * Compares two UTC time strings
 *
 * @param time1 - First UTC time (HH:mm)
 * @param time2 - Second UTC time (HH:mm)
 * @returns -1 if time1 < time2, 0 if equal, 1 if time1 > time2
 *
 * @example
 * compareUTCTimes("09:00", "14:00") → -1
 * compareUTCTimes("14:00", "09:00") → 1
 * compareUTCTimes("14:00", "14:00") → 0
 */
export function compareUTCTimes(time1: string, time2: string): number {
  if (time1 < time2) return -1;
  if (time1 > time2) return 1;
  return 0;
}

/**
 * Checks if two UTC time ranges overlap
 *
 * Overlap logic (half-open intervals [start, end)):
 * - Ranges overlap if: start1 < end2 AND start2 < end1
 * - Does NOT include exact boundaries (e.g., "09:00-13:00" and "13:00-17:00" do NOT overlap)
 *
 * @param start1 - Start of first range (HH:mm)
 * @param end1 - End of first range (HH:mm)
 * @param start2 - Start of second range (HH:mm)
 * @param end2 - End of second range (HH:mm)
 * @returns true if ranges overlap, false otherwise
 *
 * @example
 * utcTimesOverlap("09:00", "17:00", "16:00", "20:00") → true  (16:00-17:00 overlaps)
 * utcTimesOverlap("09:00", "13:00", "14:00", "18:00") → false (no overlap)
 * utcTimesOverlap("09:00", "13:00", "13:00", "17:00") → false (adjacent, no overlap)
 * utcTimesOverlap("09:00", "17:00", "10:00", "16:00") → true  (10:00-16:00 inside)
 */
export function utcTimesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Standard interval overlap check
  return start1 < end2 && start2 < end1;
}

/**
 * Checks if a UTC time falls within a range (inclusive)
 *
 * @param time - UTC time to check (HH:mm)
 * @param rangeStart - Start of range (HH:mm)
 * @param rangeEnd - End of range (HH:mm)
 * @returns true if time is within [rangeStart, rangeEnd), false otherwise
 *
 * @example
 * isTimeInRange("14:00", "09:00", "17:00") → true
 * isTimeInRange("08:00", "09:00", "17:00") → false
 * isTimeInRange("17:00", "09:00", "17:00") → false (exclusive end)
 */
export function isTimeInRange(time: string, rangeStart: string, rangeEnd: string): boolean {
  return time >= rangeStart && time < rangeEnd;
}

/**
 * Calculates duration in minutes between two UTC times
 *
 * Assumes same-day times (no overnight calculation).
 * For overnight shifts, end time must be less than start time.
 *
 * @param startTime - Start UTC time (HH:mm)
 * @param endTime - End UTC time (HH:mm)
 * @returns Duration in minutes
 *
 * @example
 * calculateDurationMinutes("09:00", "17:00") → 480 (8 hours)
 * calculateDurationMinutes("14:30", "16:45") → 135 (2h 15m)
 * calculateDurationMinutes("23:00", "01:00") → -1320 (invalid - overnight not supported)
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  return endTotalMinutes - startTotalMinutes;
}

/**
 * Validates that end time is after start time (no overnight shifts)
 *
 * @param startTime - Start UTC time (HH:mm)
 * @param endTime - End UTC time (HH:mm)
 * @returns true if endTime > startTime, false otherwise
 *
 * @example
 * isValidTimeRange("09:00", "17:00") → true
 * isValidTimeRange("17:00", "09:00") → false (overnight)
 * isValidTimeRange("14:00", "14:00") → false (same time)
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  return endTime > startTime;
}

/**
 * Formats minutes into "Xh Ym" string
 *
 * @param minutes - Total minutes
 * @returns Formatted string (e.g., "8h 30m")
 *
 * @example
 * formatDuration(480) → "8h 0m"
 * formatDuration(135) → "2h 15m"
 * formatDuration(45) → "0h 45m"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * DEPRECATED: Legacy time conversion functions
 *
 * These functions are kept for backward compatibility but should NOT be used in new code.
 * All new code should assume times are already in UTC.
 */

/**
 * @deprecated Use toUTCDateTime instead. This function assumes input is already UTC.
 */
export function utcTimeToDateTime(utcTimeString: string): Date {
  console.warn('[DEPRECATED] utcTimeToDateTime is deprecated. Use toUTCDateTime instead.');
  return toUTCDateTime(utcTimeString);
}

/**
 * @deprecated Use fromUTCDateTime instead. This function returns UTC time directly.
 */
export function dateTimeToUtcTime(dateTime: Date): string {
  console.warn('[DEPRECATED] dateTimeToUtcTime is deprecated. Use fromUTCDateTime instead.');
  return fromUTCDateTime(dateTime);
}
