/**
 * Job status abbreviations for timesheet display
 * Max 3 letters for narrow columns
 */
export const JOB_STATUS_ABBREVIATIONS: Record<string, string> = {
  active: "ACT",
  on_vacation: "VAC",
  cancelled: "CAN",
  absconded: "ABS",
  absent: "ABT",
  sick_leave: "SIC",
  casual_leave: "CAS",
  notice_period: "NOT",
  resigned: "RES",
  idle: "IDL",
};

/**
 * Job status colors for visual distinction
 */
export const JOB_STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  active: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
    border: "border-green-300 dark:border-green-700",
  },
  on_vacation: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700",
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    border: "border-red-300 dark:border-red-700",
  },
  absconded: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    border: "border-red-300 dark:border-red-700",
  },
  absent: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-300",
    border: "border-yellow-300 dark:border-yellow-700",
  },
  sick_leave: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-300",
    border: "border-orange-300 dark:border-orange-700",
  },
  casual_leave: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-800 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700",
  },
  notice_period: {
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-800 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-700",
  },
  resigned: {
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-800 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-700",
  },
  idle: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-800 dark:text-indigo-300",
    border: "border-indigo-300 dark:border-indigo-700",
  },
};

/**
 * Get abbreviated status text
 */
export function getStatusAbbreviation(status: string | null): string {
  if (!status) return "-";
  return (
    JOB_STATUS_ABBREVIATIONS[status] || status.substring(0, 3).toUpperCase()
  );
}

/**
 * Get status colors
 */
export function getStatusColors(status: string | null): {
  bg: string;
  text: string;
  border: string;
} {
  if (!status) {
    return {
      bg: "bg-gray-50 dark:bg-gray-800",
      text: "text-gray-400 dark:text-gray-600",
      border: "border-gray-200 dark:border-gray-700",
    };
  }
  return JOB_STATUS_COLORS[status] || JOB_STATUS_COLORS.active;
}

/**
 * Get full status name
 */
export function getStatusFullName(status: string | null): string {
  if (!status) return "Not Mobilized";

  const statusNames: Record<string, string> = {
    active: "Active",
    on_vacation: "On Vacation",
    cancelled: "Cancelled",
    absconded: "Absconded",
    absent: "Absent",
    sick_leave: "Sick Leave",
    casual_leave: "Casual Leave",
    notice_period: "Notice Period",
    resigned: "Resigned",
    idle: "Idle",
  };

  return statusNames[status] || status;
}
