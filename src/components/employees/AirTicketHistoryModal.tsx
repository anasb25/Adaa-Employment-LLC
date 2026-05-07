import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "../../services/api/employeesApi";
import { QUERY_KEYS } from "../../lib/constants";
import type { AirTicketHistoryEntry } from "../../types/employee";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";

const REASON_LABELS: Record<string, string> = {
  service_accrual: "Service accrual (auto)",
  manual_adjust: "Manual adjustment",
  ticket_used: "Ticket used",
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function sortHistoryNewestFirst(entries: AirTicketHistoryEntry[]): AirTicketHistoryEntry[] {
  return [...entries].sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

interface AirTicketHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
}

export default function AirTicketHistoryModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
}: AirTicketHistoryModalProps) {
  const { data: employee, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEYS.employees.detail(employeeId),
    queryFn: () => employeesApi.getEmployee(employeeId),
    enabled: isOpen && employeeId > 0,
  });

  const rows = useMemo(
    () => sortHistoryNewestFirst(employee?.air_tickets_history ?? []),
    [employee?.air_tickets_history],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Air ticket history — ${employeeName}`}
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
              "Could not load air ticket history for this employee."}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No air ticket changes recorded yet. Entries are added when tickets
            accrue automatically, are adjusted manually, or are marked as used.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    When
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Change
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Balance after
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-white/[0.03]">
                {rows.map((row, idx) => (
                  <tr key={`${row.at}-${idx}`}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {formatDateTime(row.at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span
                        className={
                          row.type === "add"
                            ? "font-medium text-green-600 dark:text-green-400"
                            : "font-medium text-orange-600 dark:text-orange-400"
                        }
                      >
                        {row.type === "add" ? "Added" : "Used / reduced"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-gray-900 dark:text-white">
                      {row.amount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums font-medium text-gray-900 dark:text-white">
                      {row.balance_after}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.reason
                        ? REASON_LABELS[row.reason] ?? row.reason
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && rows.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Current balance:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {employee?.air_tickets ?? 0}
            </span>{" "}
            ticket(s).
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
