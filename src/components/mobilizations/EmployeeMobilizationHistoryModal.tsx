import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mobilizationsApi } from "../../services/api/mobilizationsApi";
import { Mobilization } from "../../types/mobilization";
import {
  MOB_STATUS_COLORS,
  JOB_STATUS_COLORS,
} from "../../lib/mobilizationConstants";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import { formatDateShort } from "../../utils/dateUtils";

interface EmployeeMobilizationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
}

export default function EmployeeMobilizationHistoryModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
}: EmployeeMobilizationHistoryModalProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Fetch employee history
  const { data: history, isLoading } = useQuery({
    queryKey: ["employee-mobilization-history", employeeId, startDate, endDate],
    queryFn: () =>
      mobilizationsApi.getEmployeeHistory(
        employeeId,
        startDate || undefined,
        endDate || undefined
      ),
    enabled: isOpen && employeeId > 0,
  });

  const getMobStatusBadge = (status: string) => {
    const colorClass =
      MOB_STATUS_COLORS[status as keyof typeof MOB_STATUS_COLORS] ||
      "bg-gray-100 text-gray-800";
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const getJobStatusBadge = (status: string) => {
    const colorClass =
      JOB_STATUS_COLORS[status as keyof typeof JOB_STATUS_COLORS] ||
      "bg-gray-100 text-gray-800";
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mobilization History - ${employeeName}`}
      size="xl"
    >
      <div className="space-y-4 p-6">
        {/* Date Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] max-h-[500px] overflow-auto">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              Loading history...
            </div>
          ) : !history || history.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No mobilization history found for the selected date range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mob Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Job Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
                  {history.map((mobilization: Mobilization) => (
                    <tr
                      key={mobilization.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatDateShort(mobilization.actionDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {mobilization.mobilizedTrade?.skill || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {mobilization.project ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {mobilization.project.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {mobilization.project.client?.name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            No Project
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getMobStatusBadge(mobilization.mobStatus)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getJobStatusBadge(mobilization.jobStatus)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {mobilization.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {history && history.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
            💡 Showing {history.length} record(s). Status between action dates
            is automatically carried forward.
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
