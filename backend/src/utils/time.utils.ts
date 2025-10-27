import { parse, format, isValid, differenceInMinutes, addMinutes } from 'date-fns';

/**
 * UTC TIME UTILITIES - CRITICAL POLICY
 *
 * This module enforces a strict UTC-only policy for all time and date operations.
 * The backend NEVER performs timezone conversions and ONLY works with UTC values.
 *
 * KEY PRINCIPLES:
 * - Time format: "HH:mm" (24-hour, e.g., "14:30", "09:00")
 * - Date format: "YYYY-MM-DD" (ISO 8601, e.g., "2025-10-26")
 * - DateTime format: ISO 8601 UTC (e.g., "2025-10-26T14:30:00.000Z")
 * - REJECT any timezone information: +00:00, Z in time strings, etc.
 * - Frontend is responsible for ALL timezone conversions for display
 *
 * NEVER use these utilities for timezone conversion.
 * NEVER accept time strings with timezone indicators.
 */

/**
 * Parse a UTC time string in HH:mm format to a Date object
 *
 * @param timeString - Time in "HH:mm" format (e.g., "14:30", "09:00")
 * @returns Date object with the time set (date portion is arbitrary)
 * @throws Error if time string is invalid or contains timezone information
 *
 * @example
 * parseUTCTime("14:30") // Returns Date with 14:30 time
 * parseUTCTime("09:00") // Returns Date with 09:00 time
 * parseUTCTime("14:30Z") // Throws error - timezone not allowed
 */
export function parseUTCTime(timeString: string): Date {
  if (!validateTimeFormat(timeString)) {
    throw new Error(
      `Invalid UTC time format: "${timeString}". Must be HH:mm format without timezone (e.g., "14:30")`
    );
  }

  // Use a fixed reference date (epoch) for time parsing
  const referenceDate = new Date('1970-01-01');
  const parsedDate = parse(timeString, 'HH:mm', referenceDate);

  if (!isValid(parsedDate)) {
    throw new Error(`Invalid time value: "${timeString}"`);
  }

  return parsedDate;
}

/**
 * Validate that a time string matches the required UTC HH:mm format
 *
 * Rules:
 * - Must be exactly "HH:mm" format (24-hour)
 * - Hours: 00-23
 * - Minutes: 00-59
 * - NO seconds, NO timezone indicators (Z, +00:00, etc.)
 *
 * @param timeString - Time string to validate
 * @returns true if valid UTC time format, false otherwise
 *
 * @example
 * validateTimeFormat("14:30") // true
 * validateTimeFormat("09:00") // true
 * validateTimeFormat("23:59") // true
 * validateTimeFormat("24:00") // false - hours must be 00-23
 * validateTimeFormat("14:30:00") // false - no seconds allowed
 * validateTimeFormat("14:30Z") // false - no timezone allowed
 * validateTimeFormat("14:30+00:00") // false - no timezone allowed
 */
export function validateTimeFormat(timeString: string): boolean {
  // Strict regex: exactly HH:mm, nothing more
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!timeRegex.test(timeString)) {
    return false;
  }

  // Additional check: reject any timezone indicators
  const hasTimezone = /[Z\+\-]/.test(timeString);
  if (hasTimezone) {
    return false;
  }

  return true;
}

/**
 * Format a Date object to UTC time string in HH:mm format
 *
 * @param date - Date object to format
 * @returns Time string in "HH:mm" format (e.g., "14:30")
 * @throws Error if date is invalid
 *
 * @example
 * formatTimeToUTC(new Date('1970-01-01T14:30:00')) // "14:30"
 * formatTimeToUTC(new Date('2025-10-26T09:00:00')) // "09:00"
 */
export function formatTimeToUTC(date: Date): string {
  if (!isValid(date)) {
    throw new Error('Invalid date object provided to formatTimeToUTC');
  }

  return format(date, 'HH:mm');
}

/**
 * Parse an ISO date string in YYYY-MM-DD format to a Date object
 *
 * @param dateString - Date in "YYYY-MM-DD" format (e.g., "2025-10-26")
 * @returns Date object with the date set (time is set to midnight)
 * @throws Error if date string is invalid
 *
 * @example
 * parseISODate("2025-10-26") // Returns Date for October 26, 2025
 * parseISODate("2025-12-31") // Returns Date for December 31, 2025
 * parseISODate("26-10-2025") // Throws error - wrong format
 */
export function parseISODate(dateString: string): Date {
  if (!validateDateFormat(dateString)) {
    throw new Error(
      `Invalid ISO date format: "${dateString}". Must be YYYY-MM-DD format (e.g., "2025-10-26")`
    );
  }

  const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());

  if (!isValid(parsedDate)) {
    throw new Error(`Invalid date value: "${dateString}"`);
  }

  return parsedDate;
}

/**
 * Validate that a date string matches the required ISO YYYY-MM-DD format
 *
 * Rules:
 * - Must be exactly "YYYY-MM-DD" format
 * - Year: 4 digits
 * - Month: 01-12
 * - Day: 01-31 (basic validation, date-fns handles month-specific)
 *
 * @param dateString - Date string to validate
 * @returns true if valid ISO date format, false otherwise
 *
 * @example
 * validateDateFormat("2025-10-26") // true
 * validateDateFormat("2025-12-31") // true
 * validateDateFormat("26-10-2025") // false - wrong order
 * validateDateFormat("2025/10/26") // false - wrong separator
 * validateDateFormat("2025-10-26T00:00:00Z") // false - no time allowed
 */
export function validateDateFormat(dateString: string): boolean {
  // Strict regex: exactly YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(dateString)) {
    return false;
  }

  // Parse to verify it's a valid date (e.g., not 2025-13-45)
  const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
  return isValid(parsedDate);
}

/**
 * Format a Date object to ISO date string in YYYY-MM-DD format
 *
 * @param date - Date object to format
 * @returns Date string in "YYYY-MM-DD" format (e.g., "2025-10-26")
 * @throws Error if date is invalid
 *
 * @example
 * formatDateToISO(new Date('2025-10-26')) // "2025-10-26"
 * formatDateToISO(new Date('2025-12-31')) // "2025-12-31"
 */
export function formatDateToISO(date: Date): string {
  if (!isValid(date)) {
    throw new Error('Invalid date object provided to formatDateToISO');
  }

  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse an ISO 8601 DateTime string to a Date object
 *
 * @param dateTimeString - DateTime in ISO 8601 format (e.g., "2025-10-26T14:30:00.000Z")
 * @returns Date object
 * @throws Error if datetime string is invalid
 *
 * @example
 * parseISODateTime("2025-10-26T14:30:00.000Z") // Returns Date object
 */
export function parseISODateTime(dateTimeString: string): Date {
  const parsedDate = new Date(dateTimeString);

  if (!isValid(parsedDate)) {
    throw new Error(`Invalid ISO DateTime: "${dateTimeString}"`);
  }

  return parsedDate;
}

/**
 * Format a Date object to ISO 8601 DateTime string in UTC
 *
 * @param date - Date object to format
 * @returns DateTime string in ISO 8601 UTC format (e.g., "2025-10-26T14:30:00.000Z")
 * @throws Error if date is invalid
 *
 * @example
 * formatDateTimeToISO(new Date()) // "2025-10-26T14:30:00.000Z"
 */
export function formatDateTimeToISO(date: Date): string {
  if (!isValid(date)) {
    throw new Error('Invalid date object provided to formatDateTimeToISO');
  }

  return date.toISOString();
}

/**
 * Calculate duration in hours between two UTC time strings
 *
 * Handles overnight shifts correctly (when end_time < start_time)
 *
 * @param startTime - Start time in "HH:mm" format
 * @param endTime - End time in "HH:mm" format
 * @returns Duration in hours (decimal, e.g., 8.5 for 8 hours 30 minutes)
 * @throws Error if time strings are invalid
 *
 * @example
 * calculateDuration("09:00", "17:00") // 8.0 hours
 * calculateDuration("14:30", "18:00") // 3.5 hours
 * calculateDuration("22:00", "06:00") // 8.0 hours (overnight shift)
 * calculateDuration("23:00", "01:00") // 2.0 hours (overnight shift)
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startDate = parseUTCTime(startTime);
  const endDate = parseUTCTime(endTime);

  let minutes = differenceInMinutes(endDate, startDate);

  // Handle overnight shifts: if end is before start, add 24 hours
  if (minutes < 0) {
    minutes += 24 * 60; // Add 24 hours in minutes
  }

  // Convert to hours with 2 decimal precision
  return Math.round((minutes / 60) * 100) / 100;
}

/**
 * Add hours to a UTC time string
 *
 * Handles wraparound correctly (e.g., 23:00 + 2 hours = 01:00)
 *
 * @param timeString - Time in "HH:mm" format
 * @param hours - Number of hours to add (can be negative)
 * @returns New time string in "HH:mm" format
 * @throws Error if time string is invalid
 *
 * @example
 * addHoursToTime("09:00", 8) // "17:00"
 * addHoursToTime("22:00", 3) // "01:00" (next day)
 * addHoursToTime("14:00", -2) // "12:00"
 */
export function addHoursToTime(timeString: string, hours: number): string {
  const date = parseUTCTime(timeString);
  const newDate = addMinutes(date, hours * 60);
  return formatTimeToUTC(newDate);
}

/**
 * Validate that a time range is valid
 *
 * Rules:
 * - start_time and end_time must be valid UTC times
 * - start_time and end_time cannot be the same
 * - Both overnight and same-day shifts are valid
 *
 * @param startTime - Start time in "HH:mm" format
 * @param endTime - End time in "HH:mm" format
 * @returns true if valid time range, false otherwise
 *
 * @example
 * isValidTimeRange("09:00", "17:00") // true
 * isValidTimeRange("22:00", "06:00") // true (overnight)
 * isValidTimeRange("09:00", "09:00") // false (same time)
 * isValidTimeRange("09:00", "invalid") // false
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  try {
    if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
      return false;
    }

    if (startTime === endTime) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a shift is an overnight shift
 *
 * An overnight shift is when the end time is numerically less than the start time
 * (e.g., 22:00 to 06:00)
 *
 * @param startTime - Start time in "HH:mm" format
 * @param endTime - End time in "HH:mm" format
 * @returns true if overnight shift, false otherwise
 * @throws Error if time strings are invalid
 *
 * @example
 * isOvernightShift("09:00", "17:00") // false
 * isOvernightShift("22:00", "06:00") // true
 * isOvernightShift("23:00", "01:00") // true
 * isOvernightShift("00:00", "23:59") // false
 */
export function isOvernightShift(startTime: string, endTime: string): boolean {
  const startDate = parseUTCTime(startTime);
  const endDate = parseUTCTime(endTime);

  const minutes = differenceInMinutes(endDate, startDate);
  return minutes < 0;
}

/**
 * Convert PostgreSQL Time value to UTC time string
 *
 * PostgreSQL stores Time as a Date object. This extracts just the time portion.
 *
 * @param pgTime - PostgreSQL Time value (Date object)
 * @returns Time string in "HH:mm" format
 *
 * @example
 * pgTimeToUTCString(new Date('1970-01-01T14:30:00')) // "14:30"
 */
export function pgTimeToUTCString(pgTime: Date): string {
  return formatTimeToUTC(pgTime);
}

/**
 * Convert UTC time string to PostgreSQL Time value
 *
 * Creates a Date object that PostgreSQL can store in a Time column.
 *
 * @param timeString - Time in "HH:mm" format
 * @returns Date object for PostgreSQL Time storage
 *
 * @example
 * utcStringToPgTime("14:30") // Date object for PostgreSQL
 */
export function utcStringToPgTime(timeString: string): Date {
  return parseUTCTime(timeString);
}

/**
 * Convert PostgreSQL Date value to ISO date string
 *
 * @param pgDate - PostgreSQL Date value (Date object)
 * @returns Date string in "YYYY-MM-DD" format
 *
 * @example
 * pgDateToISOString(new Date('2025-10-26')) // "2025-10-26"
 */
export function pgDateToISOString(pgDate: Date): string {
  return formatDateToISO(pgDate);
}

/**
 * Convert ISO date string to PostgreSQL Date value
 *
 * @param dateString - Date in "YYYY-MM-DD" format
 * @returns Date object for PostgreSQL Date storage
 *
 * @example
 * isoStringToPgDate("2025-10-26") // Date object for PostgreSQL
 */
export function isoStringToPgDate(dateString: string): Date {
  return parseISODate(dateString);
}
