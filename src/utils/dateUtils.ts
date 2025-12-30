/**
 * Timezone-neutral date utilities for the frontend
 * These utilities ensure dates are treated as calendar dates without timezone conversion
 */

/**
 * Formats a date string (YYYY-MM-DD) to a localized date string without timezone shifts
 * @param dateStr Date string in YYYY-MM-DD format
 * @param options Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDateOnly(
  dateStr: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return '';

  // Extract date parts from string to avoid timezone conversion
  let year: number, month: number, day: number;

  if (typeof dateStr === 'string') {
    // If it's a string in YYYY-MM-DD format
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10) - 1; // JavaScript months are 0-indexed
      day = parseInt(match[3], 10);
    } else {
      // Fallback: try parsing as date
      const date = new Date(dateStr);
      year = date.getFullYear();
      month = date.getMonth();
      day = date.getDate();
    }
  } else {
    // If it's a Date object
    year = dateStr.getFullYear();
    month = dateStr.getMonth();
    day = dateStr.getDate();
  }

  // Create a date at local midnight (no timezone conversion)
  const date = new Date(year, month, day);

  // Format using Intl.DateTimeFormat
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return date.toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Formats a date string to long format (e.g., "Monday, January 15, 2024")
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDateLong(dateStr: string): string {
  return formatDateOnly(dateStr, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats a date string to short format (e.g., "Jan 15, 2024")
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDateShort(dateStr: string): string {
  return formatDateOnly(dateStr, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Gets today's date in YYYY-MM-DD format (timezone-neutral)
 * @returns Today's date string
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a date to YYYY-MM-DD format (timezone-neutral)
 * @param date Date object or string
 * @returns Date string in YYYY-MM-DD format
 */
export function toDateString(date: Date | string): string {
  if (!date) return '';

  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as-is
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return match[0];
    }
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

