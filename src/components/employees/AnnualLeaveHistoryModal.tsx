import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { mobilizationsApi } from "../../services/api/mobilizationsApi";
import { Mobilization } from "../../types/mobilization";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import {
  formatDateShort,
  getTodayDateString,
  toDateString,
} from "../../utils/dateUtils";

interface AnnualLeavePeriod {
  startMobilizationId: number;
  startDate: string;
  endDate: string | null;
  calendarDaysInclusive: number;
  notes: string | null;
}

function parseCalendarParts(dateStr: string): [number, number, number] | null {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

function addCalendarDays(dateStr: string, deltaDays: number): string {
  const parts = parseCalendarParts(dateStr);
  if (!parts) return dateStr;
  const [y, mo, d] = parts;
  const dt = new Date(y, mo - 1, d + deltaDays);
  return toDateString(dt);
}

/** Inclusive calendar days between two YYYY-MM-DD strings (timezone-neutral parts). */
function daysInclusiveBetween(fromStr: string, toStr: string): number {
  const a = parseCalendarParts(fromStr);
  const b = parseCalendarParts(toStr);
  if (!a || !b) return 0;
  const from = new Date(a[0], a[1] - 1, a[2]).getTime();
  const to = new Date(b[0], b[1] - 1, b[2]).getTime();
  return Math.floor((to - from) / 86400000) + 1;
}

/**
 * Reconstruct annual leave stretches from discrete mobilization rows.
 * A row with jobStatus annual_leave starts a period that ends the day before
 * the chronologically next mobilization (any status), or is treated as ongoing
 * through today if there is no later row.
 */
function computeAnnualLeavePeriods(
  mobilizations: Mobilization[],
): AnnualLeavePeriod[] {
  if (!mobilizations?.length) return [];

  const sorted = [...mobilizations].sort((a, b) => {
    const d = String(a.actionDate).localeCompare(String(b.actionDate));
    if (d !== 0) return d;
    const ca = String(a.createdAt ?? "");
    const cb = String(b.createdAt ?? "");
    if (ca !== cb) return ca.localeCompare(cb);
    return a.id - b.id;
  });

  const periods: AnnualLeavePeriod[] = [];
  const today = getTodayDateString();

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    if (String(row.jobStatus) !== "annual_leave") continue;

    const next = sorted[i + 1];
    const startDate = String(row.actionDate);
    let endDate: string | null;
    if (next) {
      endDate = addCalendarDays(String(next.actionDate), -1);
    } else {
      endDate = null;
    }

    let calendarDaysInclusive: number;
    if (endDate) {
      calendarDaysInclusive = Math.max(
        0,
        daysInclusiveBetween(startDate, endDate),
      );
    } else {
      calendarDaysInclusive = Math.max(
        0,
        daysInclusiveBetween(startDate, today),
      );
    }

    periods.push({
      startMobilizationId: row.id,
      startDate,
      endDate,
      calendarDaysInclusive,
      notes: row.notes ?? null,
    });
  }

  periods.sort((a, b) => b.startDate.localeCompare(a.startDate));
  return periods;
}

interface AnnualLeaveHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
}

export default function AnnualLeaveHistoryModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
}: AnnualLeaveHistoryModalProps) {
  const {
    data: history,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["employee-mobilizations-full-history", employeeId],
    queryFn: () => mobilizationsApi.getEmployeeHistory(employeeId),
    enabled: isOpen && employeeId > 0,
  });

  const periods = useMemo(
    () => computeAnnualLeavePeriods(history ?? []),
    [history],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Annual leave history — ${employeeName}`}
      size="xl"
    >
      <div className="space-y-4 p-6">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            Loading…
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {(error as Error)?.message ||
              "Could not load mobilization history."}
          </div>
        ) : periods.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No annual leave periods recorded in mobilization history.
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] max-h-[460px] overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Leave starts
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Leave ends
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Days
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-white/[0.03]">
                {periods.map((p) => (
                  <tr key={p.startMobilizationId}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {formatDateShort(p.startDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {p.endDate ? (
                        formatDateShort(p.endDate)
                      ) : (
                        <span className="italic text-gray-500 dark:text-gray-400">
                          Ongoing / through today
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {p.calendarDaysInclusive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && periods.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Periods are derived from mobilization records marked annual leave:
            leave runs from each start date until the day before the next status
            change. Calendar days shown are inclusive.
          </p>
        )}

        <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
