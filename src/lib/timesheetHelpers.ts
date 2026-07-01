import { IDLE_PROJECT_ID } from "../types/timesheet";

/**
 * Job status abbreviations for timesheet display
 * Max 3 letters for narrow columns
 */
export const JOB_STATUS_ABBREVIATIONS: Record<string, string> = {
  active: "ACT",
  annual_leave: "AL",
  cancelled: "CAN",
  absconded: "ABS",
  absent: "A",
  sick_leave: "SL",
  casual_leave: "CL",
  urgent_leave: "UL",
  notice_period: "NP",
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
  annual_leave: {
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
  urgent_leave: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-800 dark:text-teal-300",
    border: "border-teal-300 dark:border-teal-700",
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
  const normalized = status.toLowerCase();
  return (
    JOB_STATUS_ABBREVIATIONS[normalized] ||
    normalized.substring(0, 3).toUpperCase()
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
    annual_leave: "Annual Leave",
    cancelled: "Cancelled",
    absconded: "Absconded",
    absent: "Absent",
    sick_leave: "Sick Leave",
    casual_leave: "Casual Leave",
    urgent_leave: "Urgent Leave",
    notice_period: "Notice Period",
    resigned: "Resigned",
    idle: "Idle",
  };

  return statusNames[status] || status;
}

/** YYYY-MM-DD as UTC calendar date — Sunday is 0 (matches backend parseDateOnly). */
export function isUtcSundayDate(dateStr: string): boolean {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return false;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (Number.isNaN(year) || Number.isNaN(month + 1) || Number.isNaN(day)) {
    return false;
  }
  return new Date(Date.UTC(year, month, day)).getUTCDay() === 0;
}

/**
 * Idle + annual-leave virtual sheet (`IDLE_PROJECT_ID`): Sundays default to forced
 * "off" for idle/non-leave rows only; annual_leave periods include Sundays.
 */
export function isIdleSheetSundayForcedOff(
  projectId: number,
  dateStr: string | undefined,
  resolvedJobStatus: string | null | undefined,
): boolean {
  if (
    projectId !== IDLE_PROJECT_ID ||
    !dateStr ||
    !isUtcSundayDate(dateStr)
  ) {
    return false;
  }
  return resolvedJobStatus?.toLowerCase() !== "annual_leave";
}

export interface TimesheetDayEdit {
  hours: number;
  status?: string;
}

/** Build save payload from edited cells only (avoids sending the full month grid). */
export function buildTimesheetSaveEntries(
  projectId: number,
  timesheetData: {
    employees?: Array<{
      employeeId: number;
      dailyHours?: Array<{ date: string; notes?: string | null }>;
    }>;
  },
  edits: Map<string, TimesheetDayEdit>,
) {
  const entries: {
    employeeId: number;
    date: string;
    hoursWorked: number;
    jobStatus: string;
    notes?: string | null;
  }[] = [];

  edits.forEach((edit, key) => {
    const match = key.match(/^(\d+)-(\d{4}-\d{2}-\d{2})$/);
    if (!match) return;

    const employeeId = Number(match[1]);
    const date = match[2];
    let hours = edit.hours;
    let status = edit.status;

    if (!status) return;

    if (isIdleSheetSundayForcedOff(projectId, date, status)) {
      hours = 0;
      status = "off";
    }

    const employee = timesheetData.employees?.find(
      (e) => e.employeeId === employeeId,
    );
    const dailyHour = employee?.dailyHours?.find((d) => d.date === date);

    entries.push({
      employeeId,
      date,
      hoursWorked: hours,
      jobStatus: status,
      notes: dailyHour?.notes,
    });
  });

  return entries;
}
