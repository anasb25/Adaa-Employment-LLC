/**
 * Convert a decimal hours value (e.g. 10.5) to "H:MM" display string (e.g. "10:30").
 * Whole hours omit the minutes part (e.g. 10 → "10").
 */
export function decimalToHM(decimal: number): string {
  if (decimal == null || isNaN(decimal)) return "0";
  const totalMinutes = Math.round(decimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return h.toString();
  return `${h}:${m.toString().padStart(2, "0")}`;
}

/**
 * Parse a user-entered time string into decimal hours.
 * Accepts: "10" → 10, "10:30" → 10.5, "10:05" → 10.0833, "0:45" → 0.75
 * Also accepts plain decimals like "10.5" as a fallback.
 * Returns null if the input is invalid.
 */
export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  if (trimmed.includes(":")) {
    const [hPart, mPart] = trimmed.split(":");
    const h = parseInt(hPart || "0", 10);
    const m = parseInt(mPart || "0", 10);
    if (isNaN(h) || isNaN(m) || h < 0 || m < 0 || m > 59) return null;
    return Math.round((h + m / 60) * 100) / 100;
  }

  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

/**
 * Formats a date string to show relative time (e.g., "5 mins ago", "2 hours ago")
 * @param dateString - The date string to format
 * @param options - Formatting options
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  dateString: string | undefined | null,
  options: {
    fallback?: string;
    showSeconds?: boolean;
    maxDays?: number;
  } = {}
): string {
  const { fallback = "Never", showSeconds = false, maxDays = 30 } = options;

  if (!dateString) return fallback;

  try {
    const now = new Date();
    const targetDate = new Date(dateString);
    const diffInSeconds = Math.floor(
      (now.getTime() - targetDate.getTime()) / 1000
    );

    // Handle future dates
    if (diffInSeconds < 0) {
      return "Just now";
    }

    // Show seconds for very recent activity
    if (showSeconds && diffInSeconds < 60) {
      if (diffInSeconds < 10) {
        return "Just now";
      }
      return `${diffInSeconds} sec${diffInSeconds === 1 ? "" : "s"} ago`;
    }

    // Less than 1 minute
    if (diffInSeconds < 60) {
      return "Just now";
    }

    // Less than 1 hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
    }

    // Less than 1 day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);

      if (minutes === 0) {
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
      }
      return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} min${
        minutes === 1 ? "" : "s"
      } ago`;
    }

    // Less than maxDays
    if (diffInSeconds < maxDays * 86400) {
      const days = Math.floor(diffInSeconds / 86400);
      const hours = Math.floor((diffInSeconds % 86400) / 3600);

      if (hours === 0) {
        return `${days} day${days === 1 ? "" : "s"} ago`;
      }
      return `${days} day${days === 1 ? "" : "s"} ${hours} hour${
        hours === 1 ? "" : "s"
      } ago`;
    }

    // Fallback to absolute date for very old dates
    return targetDate.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Unknown";
  }
}

/**
 * Formats a date string to show relative time with more precision
 * @param dateString - The date string to format
 * @returns Formatted relative time string with seconds
 */
export function formatRelativeTimeWithSeconds(
  dateString: string | undefined | null
): string {
  return formatRelativeTime(dateString, { showSeconds: true });
}

/**
 * Formats a date string to show relative time for activity tracking
 * @param dateString - The date string to format
 * @returns Formatted relative time string optimized for activity display
 */
export function formatActivityTime(
  dateString: string | undefined | null
): string {
  return formatRelativeTime(dateString, {
    fallback: "Never",
    showSeconds: false,
    maxDays: 7, // Show absolute date after 7 days
  });
}

/**
 * Formats a date string to show relative time for recent activity
 * @param dateString - The date string to format
 * @returns Formatted relative time string for recent activity
 */
export function formatRecentActivity(
  dateString: string | undefined | null
): string {
  return formatRelativeTime(dateString, {
    fallback: "Never",
    showSeconds: true,
    maxDays: 1, // Show absolute date after 1 day
  });
}
