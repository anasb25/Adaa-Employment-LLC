import type { AirTicketHistoryEntry } from "../types/employee";

/**
 * Tickets marked subtracted in `air_tickets_history` whose `at` falls in the
 * payroll month (YYYY-MM), UTC — same rule as payslip PDF.
 */
export function airTicketsUsedInPayrollMonth(
  monthYYYYMM: string,
  history: AirTicketHistoryEntry[] | null | undefined,
): number {
  const month = monthYYYYMM?.trim();
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return 0;
  if (!Array.isArray(history)) return 0;

  const [yStr, mStr] = month.split("-");
  const y = parseInt(yStr, 10);
  const mo = parseInt(mStr, 10);
  const start = Date.UTC(y, mo - 1, 1, 0, 0, 0, 0);
  const end = Date.UTC(y, mo, 1, 0, 0, 0, 0);

  let total = 0;
  for (const entry of history) {
    if (entry?.type !== "subtract") continue;
    const t = new Date(entry.at).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= start && t < end) {
      total += Math.max(0, Math.floor(Number(entry.amount) || 0));
    }
  }
  return total;
}
