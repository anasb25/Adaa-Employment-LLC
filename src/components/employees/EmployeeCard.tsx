import { memo, useMemo } from "react";
import { Employee } from "../../types/employee";
import {
  JOB_STATUS_OPTIONS,
  JOB_STATUS_COLORS,
} from "../../lib/mobilizationConstants";
import { JobStatus } from "../../types/mobilization";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: number) => void;
  isDeleting?: boolean;
}

export default memo(function EmployeeCard({
  employee,
  onEdit,
  onDelete,
  isDeleting,
}: EmployeeCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const statusLabel = employee.latestMobilization
    ? JOB_STATUS_OPTIONS.find(
        (o) => o.value === employee.latestMobilization?.jobStatus
      )?.label || employee.latestMobilization.jobStatus
    : "Not Mobilized";

  const statusColorClass = employee.latestMobilization
    ? JOB_STATUS_COLORS[employee.latestMobilization.jobStatus as JobStatus] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";

  // Memoize formatted dates
  const formattedDob = useMemo(() => formatDate(employee.dob), [employee.dob]);
  const formattedJoining = useMemo(
    () => formatDate(employee.date_of_joining),
    [employee.date_of_joining]
  );
  const formattedArrival = useMemo(
    () => formatDate(employee.date_of_arrival),
    [employee.date_of_arrival]
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/20 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-brand-600 dark:text-brand-400">
                {employee.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {employee.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Code: {employee.adaa_emp_code}
              </p>
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Date of Birth
          </p>
          <p className="text-gray-900 dark:text-white">{formattedDob}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Contact No
          </p>
          <p className="text-gray-900 dark:text-white">
            {employee.contact_no || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Nationality
          </p>
          <p className="text-gray-900 dark:text-white">
            {employee.nationality || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Emirates ID
          </p>
          <p className="text-gray-900 dark:text-white">
            {employee.emirates_id || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Date of Joining
          </p>
          <p className="text-gray-900 dark:text-white">{formattedJoining}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Date of Arrival
          </p>
          <p className="text-gray-900 dark:text-white">{formattedArrival}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Employee ID: #{employee.id}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(employee)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(employee.id)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
});
