import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeesApi } from "../../services/api/employeesApi";
import { QUERY_KEYS } from "../../lib/constants";
import Badge from "../ui/badge/Badge";
import StarRating from "../ui/StarRating";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Pagination from "../ui/pagination/Pagination";
import {
  AlertIcon as SearchIcon,
  PencilIcon,
  TrashBinIcon,
  PlusIcon,
  FileIcon,
  DownloadIcon,
} from "../../icons";
import { useSearch } from "../../hooks/useDebounce";
import { Employee } from "../../types/employee";
import {
  JOB_STATUS_OPTIONS,
  JOB_STATUS_COLORS,
} from "../../lib/mobilizationConstants";
import { JobStatus } from "../../types/mobilization";
import PermissionGuard from "../auth/PermissionGuard";
import EmployeeImportModal from "./EmployeeImportModal";
import { downloadFile } from "../../utils/excelValidator";

interface EmployeeListProps {
  onCreateEmployee?: () => void;
  onEditEmployee?: (employee: Employee) => void;
  totalEmployees?: number;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "N/A";
  }
};

const getLeaveDetails = (employee: Employee) => {
  if (!employee.date_of_joining) {
    return { totalService: "N/A", daysEarned: 0, daysTaken: 0, balance: 0 };
  }
  const joinDate = new Date(employee.date_of_joining);
  const now = new Date();
  const totalMs = now.getTime() - joinDate.getTime();
  const totalYears = totalMs / (365.25 * 24 * 60 * 60 * 1000);
  const fullYears = Math.floor(totalYears);
  const remainingMonths = Math.floor((totalYears - fullYears) * 12);

  const parts: string[] = [];
  if (fullYears > 0) parts.push(`${fullYears}y`);
  if (remainingMonths > 0) parts.push(`${remainingMonths}m`);
  const totalService = parts.length > 0 ? parts.join(" ") : "< 1m";

  const daysEarned = fullYears * 30;
  const balance = Number(employee.annual_leave_balance ?? 0);
  const daysTaken = Math.max(0, daysEarned - balance);

  return { totalService, daysEarned, daysTaken, balance };
};

export default function EmployeeList({
  onCreateEmployee,
  onEditEmployee,
  totalEmployees = 0,
}: EmployeeListProps) {
  const [page, setPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const limit = 10;

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeesApi.deleteEmployee(id),
    onSuccess: () => {
      toast.success("Employee deleted successfully!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.search,
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete employee");
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: (ids: number[]) => employeesApi.deleteMany(ids),
    onSuccess: (data) => {
      toast.success(`${data.deleted} employee(s) deleted successfully!`);
      setSelectedIds(new Set());
      setIsSelectMode(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.search });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete employees");
    },
  });

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.size} employee(s)?`
      )
    ) {
      deleteManyMutation.mutate(Array.from(selectedIds));
    }
  }, [selectedIds, deleteManyMutation]);

  const toggleSelectAll = useCallback(
    (employees: any[]) => {
      if (selectedIds.size === employees.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(employees.map((e) => e.id)));
      }
    },
    [selectedIds]
  );

  // Decrement air ticket mutation
  const decrementAirTicketMutation = useMutation({
    mutationFn: (id: number) => employeesApi.decrementAirTicket(id),
    onSuccess: () => {
      toast.success("Air ticket decremented successfully!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.search,
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to decrement air ticket"
      );
    },
  });

  // Export employees mutation
  const exportMutation = useMutation({
    mutationFn: () => employeesApi.exportEmployees(),
    onSuccess: (blob) => {
      downloadFile(
        blob,
        `employees_export_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Employees exported successfully!");
    },
    onError: () => {
      toast.error("Failed to export employees");
    },
  });

  const handleEdit = useCallback(
    (employee: Employee) => {
      if (onEditEmployee) {
        onEditEmployee(employee);
      }
    },
    [onEditEmployee]
  );

  const handleDelete = useCallback(
    (employeeId: number) => {
      if (window.confirm("Are you sure you want to delete this employee?")) {
        deleteMutation.mutate(employeeId);
      }
    },
    [deleteMutation]
  );

  // Use the custom search hook with debouncing
  const {
    searchValue,
    debouncedSearchValue,
    handleSearchChange,
    clearSearch,
    isSearching,
  } = useSearch("", 300, () => {
    // Reset to first page when search changes
    setPage(1);
  });

  // Fetch employees with pagination
  const {
    data: employeesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...QUERY_KEYS.employees.all, page, limit],
    queryFn: () => employeesApi.getEmployees(page, limit),
    enabled: !isSearching,
  });

  // Search employees
  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: [
      ...QUERY_KEYS.employees.search,
      debouncedSearchValue,
      page,
      limit,
    ],
    queryFn: () =>
      employeesApi.searchEmployees(debouncedSearchValue, page, limit),
    enabled: isSearching,
  });

  const handleClearSearch = useCallback(() => {
    clearSearch();
    setPage(1);
  }, [clearSearch]);

  const currentData = isSearching ? searchData : employeesData;
  const isLoadingData = isLoading || isSearchLoading;

  return (
    <div className="space-y-6">
      {/* Header with Search Bar and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search employees by name, code, ID, or contact..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {isSearching && (
            <Button onClick={handleClearSearch} variant="outline" size="sm">
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Employees: {totalEmployees}
          </div>
          <PermissionGuard permission="employee:read">
            <Button
              onClick={() => exportMutation.mutate()}
              variant="outline"
              startIcon={<DownloadIcon />}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? "Exporting..." : "Export"}
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="employee:create">
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              startIcon={<FileIcon />}
            >
              Import
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="employee:delete">
            {!isSelectMode ? (
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                onClick={() => setIsSelectMode(true)}
              >
                Delete Multiple
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0 || deleteManyMutation.isPending}
                >
                  {deleteManyMutation.isPending ? "Deleting..." : "Confirm Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedIds(new Set());
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </PermissionGuard>
          <PermissionGuard permission="employee:create">
            <Button onClick={onCreateEmployee} startIcon={<PlusIcon />}>
              Create Employee
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Failed to load employees
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoadingData && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingData &&
        !error &&
        (!currentData?.data || currentData.data.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <SearchIcon className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isSearching ? "No employees found" : "No employees available"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {isSearching
                ? `No employees match "${debouncedSearchValue}". Try adjusting your search terms.`
                : "There are no employees in the system yet."}
            </p>
            {isSearching ? (
              <Button onClick={handleClearSearch} variant="outline">
                Clear Search
              </Button>
            ) : (
              onCreateEmployee && (
                <Button onClick={onCreateEmployee}>
                  Create First Employee
                </Button>
              )
            )}
          </div>
        )}

      {/* Employees Card Grid */}
      {!isLoadingData &&
        !error &&
        currentData?.data &&
        currentData.data.length > 0 && (
          <>
            {isSelectMode && currentData.data.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === currentData.data.length}
                  onChange={() => toggleSelectAll(currentData.data)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Select All
                </span>
              </div>
            )}
            <div className="space-y-3">
              {currentData.data.map((employee) => (
                <div
                  key={employee.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl border p-4 ${
                    isSelectMode && selectedIds.has(employee.id)
                      ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/10"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {/* Employee Header */}
                  <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      {isSelectMode && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(employee.id)}
                          onChange={() => toggleSelect(employee.id)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 flex-shrink-0"
                        />
                      )}
                      <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-semibold text-brand-600 dark:text-brand-400">
                          {employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {employee.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ADAA Code: {employee.adaa_emp_code}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {employee.latestMobilization ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            JOB_STATUS_COLORS[
                              employee.latestMobilization.jobStatus as JobStatus
                            ] ||
                            "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                          }`}
                        >
                          {JOB_STATUS_OPTIONS.find(
                            (o) =>
                              o.value === employee.latestMobilization?.jobStatus
                          )?.label || employee.latestMobilization.jobStatus}
                        </span>
                      ) : (
                        <Badge size="sm" color="light">
                          Not Mobilized
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                        className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      {employee.air_tickets !== undefined &&
                        employee.air_tickets > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              decrementAirTicketMutation.mutate(employee.id)
                            }
                            disabled={
                              decrementAirTicketMutation.isPending &&
                              decrementAirTicketMutation.variables ===
                                employee.id
                            }
                            title={`Decrement air ticket (Current: ${employee.air_tickets})`}
                            className="px-3 py-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20"
                          >
                            <span className="w-4 h-4 flex items-center justify-center font-bold">
                              −
                            </span>
                          </Button>
                        )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
                        disabled={
                          deleteMutation.isPending &&
                          deleteMutation.variables === employee.id
                        }
                        className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
                    {/* Basic Information Card */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                        Basic Information
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Date of Birth:
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {formatDate(employee.dob)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Nationality:
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {employee.nationality || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Personal Code:
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {employee.personal_code || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Contact:
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {employee.contact_no || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Date of Arrival:
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {formatDate(employee.date_of_arrival)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Date of Joining:
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {formatDate(employee.date_of_joining)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Identity + Skills Column */}
                    <div className="space-y-3">
                      {/* Identity Card */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                          Identity
                        </h4>
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Emirates ID:
                            </span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {employee.emirates_id || "N/A"}
                            </span>
                            {employee.emirates_id_expiry && (
                              <span className="ml-2 text-gray-500 dark:text-gray-400">
                                (Exp: {formatDate(employee.emirates_id_expiry)})
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Passport No:
                            </span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {employee.pp_no || "N/A"}
                            </span>
                            {employee.pp_expiry && (
                              <span className="ml-2 text-gray-500 dark:text-gray-400">
                                (Exp: {formatDate(employee.pp_expiry)})
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Visa Expiry:
                            </span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {formatDate(employee.visa_expiry)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Work Permit:
                            </span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {employee.work_permit_no || "N/A"}
                            </span>
                            {employee.work_permit_expiry && (
                              <span className="ml-2 text-gray-500 dark:text-gray-400">
                                (Exp: {formatDate(employee.work_permit_expiry)})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Skills Card */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                          Skills & Rates
                        </h4>
                        <div className="space-y-1.5">
                          {employee.employeeSkills &&
                          employee.employeeSkills.length > 0 ? (
                            <>
                              {employee.employeeSkills.filter((es) => es?.skill).map((es) => (
                                <div
                                  key={es.id}
                                  className="text-xs space-y-1 pb-2 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-900 dark:text-white font-medium">
                                      {es.skill?.skill ?? "Unknown Skill"}
                                    </span>
                                    <StarRating
                                      rating={es.rating}
                                      maxRating={5}
                                      size="sm"
                                    />
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    {es.cost_price !== null &&
                                    es.cost_price !== undefined ? (
                                      <>
                                        Rate:{" "}
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                          AED {Number(es.cost_price).toFixed(2)}
                                          /hr
                                        </span>
                                      </>
                                    ) : (
                                      <span className="italic text-gray-400 dark:text-gray-500">
                                        Rate: Not set
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">
                              No skills assigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Leave & Service Card */}
                    {(() => {
                      const leave = getLeaveDetails(employee);
                      return (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                          <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Leave & Service
                          </h4>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-300">
                                Total Service:
                              </span>
                              <span className="font-medium text-blue-900 dark:text-blue-100">
                                {leave.totalService}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-300">
                                Days Earned:
                              </span>
                              <span className="font-medium text-blue-900 dark:text-blue-100">
                                {leave.daysEarned}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-300">
                                Days Taken:
                              </span>
                              <span className="font-medium text-blue-900 dark:text-blue-100">
                                {leave.daysTaken}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 mt-2 border-t border-blue-200 dark:border-blue-700">
                              <span className="font-semibold text-blue-900 dark:text-blue-100">
                                Balance:
                              </span>
                              <span className="font-bold text-blue-900 dark:text-blue-100">
                                {leave.balance} days
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-300">
                                Air Tickets:
                              </span>
                              <span className="font-medium text-blue-900 dark:text-blue-100">
                                {employee.air_tickets ?? 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Salary Information Card */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <h4 className="text-xs font-semibold text-green-900 dark:text-green-100 mb-2">
                        Salary Information
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">
                            Basic Salary:
                          </span>
                          <span className="font-medium text-green-900 dark:text-green-100">
                            {employee.basic_salary
                              ? `AED ${Number(employee.basic_salary).toFixed(
                                  2
                                )}`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">
                            HRA:
                          </span>
                          <span className="font-medium text-green-900 dark:text-green-100">
                            {employee.hra
                              ? `AED ${Number(employee.hra).toFixed(2)}`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">
                            Other Allowance:
                          </span>
                          <span className="font-medium text-green-900 dark:text-green-100">
                            {employee.other_allowance
                              ? `AED ${Number(employee.other_allowance).toFixed(
                                  2
                                )}`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 mt-2 border-t border-green-200 dark:border-green-700">
                          <span className="font-semibold text-green-900 dark:text-green-100">
                            Monthly Total:
                          </span>
                          <span className="font-bold text-green-900 dark:text-green-100">
                            AED{" "}
                            {(
                              (Number(employee.basic_salary) || 0) +
                              (Number(employee.hra) || 0) +
                              (Number(employee.other_allowance) || 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentData.page}
              totalPages={currentData.totalPages}
              totalItems={currentData.total}
              itemsPerPage={currentData.limit}
              onPageChange={setPage}
            />
          </>
        )}

      {/* Import Modal */}
      <EmployeeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
