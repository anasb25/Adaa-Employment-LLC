import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeesApi } from "../../services/api/employeesApi";
import { QUERY_KEYS } from "../../lib/constants";
import Badge from "../ui/badge/Badge";
import StarRating from "../ui/StarRating";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Pagination from "../ui/pagination/Pagination";
import {
  AlertIcon as SearchIcon,
  PencilIcon,
  TrashBinIcon,
  PlusIcon,
} from "../../icons";
import { useSearch } from "../../hooks/useDebounce";
import { Employee, EmployeeStatus } from "../../types/employee";
import { AttendanceStatus } from "../../types/timesheet";
import PermissionGuard from "../auth/PermissionGuard";

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

export default function EmployeeList({
  onCreateEmployee,
  onEditEmployee,
  totalEmployees = 0,
}: EmployeeListProps) {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"normal" | "timesheet">("timesheet"); // Default to timesheet view
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>("");
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
    enabled: isSearching && viewMode === "normal",
  });

  // Fetch employees with timesheet status for selected date
  const { data: timesheetEmployeesData, isLoading: isTimesheetLoading } =
    useQuery({
      queryKey: [
        "employees-with-timesheet",
        selectedDate,
        statusFilter,
        page,
        limit,
      ],
      queryFn: () =>
        employeesApi.getEmployeesWithTimesheetStatus(
          selectedDate,
          statusFilter || undefined,
          page,
          limit
        ),
      enabled: viewMode === "timesheet",
    });

  const handleClearSearch = useCallback(() => {
    clearSearch();
    setPage(1);
  }, [clearSearch]);

  const currentData =
    viewMode === "timesheet"
      ? timesheetEmployeesData
      : isSearching
      ? searchData
      : employeesData;
  const isLoadingData =
    viewMode === "timesheet"
      ? isTimesheetLoading
      : isLoading || isSearchLoading;

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant={viewMode === "timesheet" ? "primary" : "outline"}
          size="sm"
          onClick={() => {
            setViewMode("timesheet");
            setPage(1);
          }}
        >
          Timesheet View
        </Button>
        <Button
          variant={viewMode === "normal" ? "primary" : "outline"}
          size="sm"
          onClick={() => {
            setViewMode("normal");
            setPage(1);
          }}
        >
          All Employees
        </Button>
      </div>

      {/* Timesheet Filters */}
      {viewMode === "timesheet" && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-blue-900 dark:text-blue-100">
                Select Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Label className="text-blue-900 dark:text-blue-100">
                Filter by Status
              </Label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:text-white/90"
              >
                <option value="">All Statuses</option>
                <option value={AttendanceStatus.ACTIVE}>Active</option>
                <option value={AttendanceStatus.ON_HOLD}>On Hold</option>
                <option value={AttendanceStatus.IDLE}>Idle</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <div className="font-semibold">Viewing:</div>
                <div>
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with Search Bar and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {viewMode === "normal" && (
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
        )}

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {viewMode === "timesheet"
              ? `Showing: ${currentData?.total || 0} employee(s)`
              : `Total Employees: ${totalEmployees}`}
          </div>
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
            <div className="space-y-3">
              {currentData.data.map((employee) => (
                <div
                  key={employee.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                >
                  {/* Employee Header */}
                  <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
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
                      {viewMode === "timesheet" && (employee as any).timesheet ? (
                        <>
                          <Badge
                            size="sm"
                            color={
                              (employee as any).timesheet.status === AttendanceStatus.ACTIVE
                                ? "success"
                                : (employee as any).timesheet.status === AttendanceStatus.ON_HOLD
                                ? "warning"
                                : "light"
                            }
                          >
                            {(employee as any).timesheet.status === AttendanceStatus.ACTIVE
                              ? "Active"
                              : (employee as any).timesheet.status === AttendanceStatus.ON_HOLD
                              ? "On Hold"
                              : "Idle"}
                          </Badge>
                          <span className="text-xs text-gray-900 dark:text-gray-100">
                            {(employee as any).timesheet.hoursWorked}h
                          </span>
                        </>
                      ) : viewMode === "timesheet" ? (
                        <Badge size="sm" color="light">
                          Idle
                        </Badge>
                      ) : (
                        <Badge
                          size="sm"
                          color={
                            employee.status === EmployeeStatus.ACTIVE
                              ? "success"
                              : "warning"
                          }
                        >
                          {employee.status === EmployeeStatus.ACTIVE
                            ? "Active"
                            : "On Vacation"}
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

                  {/* Timesheet Information (only in timesheet view) */}
                  {viewMode === "timesheet" && (employee as any).timesheet && (
                    <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <div className="text-gray-500 dark:text-gray-400 mb-1">
                              Project
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {(employee as any).allocation?.project?.name || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 dark:text-gray-400 mb-1">
                              Trade in Site
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {(employee as any).timesheet.tradeInSite?.skill || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 dark:text-gray-400 mb-1">
                              Hours Worked
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {(employee as any).timesheet.hoursWorked}h
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 dark:text-gray-400 mb-1">
                              Status
                            </div>
                            <Badge
                              size="sm"
                              color={
                                (employee as any).timesheet.status === AttendanceStatus.ACTIVE
                                  ? "success"
                                  : (employee as any).timesheet.status === AttendanceStatus.ON_HOLD
                                  ? "warning"
                                  : "light"
                              }
                            >
                              {(employee as any).timesheet.status === AttendanceStatus.ACTIVE
                                ? "Active"
                                : (employee as any).timesheet.status === AttendanceStatus.ON_HOLD
                                ? "On Hold"
                                : "Idle"}
                            </Badge>
                          </div>
                        </div>
                        {(employee as any).timesheet.notes && (
                          <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                              Notes
                            </div>
                            <div className="text-gray-900 dark:text-white text-xs">
                              {(employee as any).timesheet.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
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
                        Skills
                      </h4>
                      <div className="space-y-1.5">
                        {employee.employeeSkills &&
                        employee.employeeSkills.length > 0 ? (
                          <>
                            {employee.employeeSkills.map((es) => (
                              <div
                                key={es.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-gray-900 dark:text-white">
                                  {es.skill.skill}
                                </span>
                                <StarRating
                                  rating={es.rating}
                                  maxRating={5}
                                  size="sm"
                                />
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
    </div>
  );
}
