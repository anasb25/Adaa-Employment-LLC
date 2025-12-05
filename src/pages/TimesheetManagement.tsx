import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { timesheetsApi } from "../services/api/timesheetsApi";
import { projectsApi } from "../services/api/projectsApi";
import { employeesApi } from "../services/api/employeesApi";
import { skillsApi } from "../services/api/skillsApi";
import { allocationsApi } from "../services/api/allocationsApi";
import { axiosInstance } from "../lib/axios";
import { QUERY_KEYS } from "../lib/constants";
import {
  Timesheet,
  UpdateTimesheetRequest,
  AttendanceStatus,
  TimesheetFilters,
} from "../types/timesheet";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import DatePicker from "../components/form/date-picker";
import Badge from "../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  AlertIcon as SearchIcon,
  PlusIcon,
  ChevronLeftIcon,
  AngleRightIcon,
} from "../icons";
import { useSearch } from "../hooks/useDebounce";

export default function TimesheetManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UpdateTimesheetRequest>({});
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(
    null
  );
  const [showProjectSelect, setShowProjectSelect] = useState(false);
  const [selectedProjectForAllocation, setSelectedProjectForAllocation] =
    useState("");

  // Filters - Initialize with today's date
  const today = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState<TimesheetFilters>({
    startDate: today,
    endDate: today,
  });
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);

  // Search hook
  const { searchValue, debouncedSearchValue, handleSearchChange, clearSearch } =
    useSearch("");

  // Fetch data
  const { data: timesheetsData, isLoading } = useQuery({
    queryKey: [
      ...QUERY_KEYS.timesheets.all,
      filters.projectId,
      filters.employeeId,
      filters.status,
      filters.startDate,
      filters.endDate,
    ],
    queryFn: () => timesheetsApi.getTimesheets(filters),
  });

  const { data: projectsData } = useQuery({
    queryKey: QUERY_KEYS.projects.all,
    queryFn: () => projectsApi.getProjects(),
  });

  const { data: employeesData } = useQuery({
    queryKey: QUERY_KEYS.employees.all,
    queryFn: () => employeesApi.getEmployees(),
  });

  const { data: skillsData } = useQuery({
    queryKey: QUERY_KEYS.skills.all,
    queryFn: () => skillsApi.getSkills(),
  });

  const { data: statsData } = useQuery({
    queryKey: QUERY_KEYS.timesheets.stats(JSON.stringify(filters)),
    queryFn: () => timesheetsApi.getTimesheetStats(filters),
  });

  // Filter timesheets based on search
  const filteredTimesheets = useMemo(() => {
    if (!timesheetsData?.data) return [];
    if (!debouncedSearchValue) return timesheetsData.data;

    const searchLower = debouncedSearchValue.toLowerCase();
    return timesheetsData.data.filter((ts: Timesheet) => {
      return (
        ts.allocation?.employee?.name?.toLowerCase().includes(searchLower) ||
        ts.allocation?.employee?.adaa_emp_code
          ?.toLowerCase()
          .includes(searchLower) ||
        ts.allocation?.project?.name?.toLowerCase().includes(searchLower) ||
        ts.tradeInSite?.skill?.toLowerCase().includes(searchLower) ||
        ts.notes?.toLowerCase().includes(searchLower)
      );
    });
  }, [timesheetsData?.data, debouncedSearchValue]);

  // Apply filters
  const applyFilters = () => {
    const newFilters: TimesheetFilters = {};
    if (selectedProject) newFilters.projectId = parseInt(selectedProject);
    if (selectedEmployee) newFilters.employeeId = parseInt(selectedEmployee);
    if (selectedStatus) newFilters.status = selectedStatus as AttendanceStatus;
    if (startDate) newFilters.startDate = startDate;
    if (endDate) newFilters.endDate = endDate;
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setSelectedProject("");
    setSelectedEmployee("");
    setSelectedStatus("");
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    setFilters({ startDate: today, endDate: today });
  };

  // Date navigation functions
  const navigateDate = (direction: "prev" | "next") => {
    const currentDate = startDate || new Date().toISOString().split("T")[0];
    const date = new Date(currentDate);
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    const newDate = date.toISOString().split("T")[0];
    setStartDate(newDate);
    setEndDate(newDate);
    // Auto-apply filters with new date
    const newFilters: TimesheetFilters = {};
    if (selectedProject) newFilters.projectId = parseInt(selectedProject);
    if (selectedEmployee) newFilters.employeeId = parseInt(selectedEmployee);
    if (selectedStatus) newFilters.status = selectedStatus as AttendanceStatus;
    newFilters.startDate = newDate;
    newFilters.endDate = newDate;
    setFilters(newFilters);
  };

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTimesheetRequest }) =>
      timesheetsApi.updateTimesheet(id, data),
    onSuccess: () => {
      toast.success("Timesheet updated successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timesheets.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.timesheets.stats(),
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update timesheet"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => timesheetsApi.deleteTimesheet(id),
    onSuccess: () => {
      toast.success("Timesheet deleted successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timesheets.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.timesheets.stats(),
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete timesheet"
      );
    },
  });

  const startEdit = (timesheet: Timesheet) => {
    setEditingId(timesheet.id);
    setEditingTimesheet(timesheet);
    setEditForm({
      status: timesheet.status,
      tradeInSiteId: timesheet.tradeInSiteId,
      hoursWorked: timesheet.hoursWorked,
      notes: timesheet.notes || "",
    });
    // Show project selector for idle employees
    if (timesheet.status === AttendanceStatus.IDLE) {
      setShowProjectSelect(true);
    } else {
      setShowProjectSelect(false);
    }
    setSelectedProjectForAllocation("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTimesheet(null);
    setEditForm({});
    setShowProjectSelect(false);
    setSelectedProjectForAllocation("");
  };

  // Helper function to get default hours
  const getDefaultHours = (status: AttendanceStatus): number => {
    switch (status) {
      case AttendanceStatus.ACTIVE:
        return 10;
      case AttendanceStatus.ON_HOLD:
        return 0;
      case AttendanceStatus.IDLE:
        return 8;
      default:
        return 10;
    }
  };

  // Unallocate mutation
  const unallocateMutation = useMutation({
    mutationFn: (allocationId: number) =>
      allocationsApi.deleteAllocation(allocationId),
    onSuccess: () => {
      toast.success("Employee unallocated from project successfully!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.allocations.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.timesheets.all,
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to unallocate employee"
      );
    },
  });

  const saveEdit = () => {
    if (!editingId || !editingTimesheet) return;

    const wasIdle = editingTimesheet.status === AttendanceStatus.IDLE;
    const isNowIdle = editForm.status === AttendanceStatus.IDLE;
    const isNowActive =
      editForm.status === AttendanceStatus.ACTIVE ||
      editForm.status === AttendanceStatus.ON_HOLD;

    // Case 1: Changing from non-idle to IDLE - need to unallocate
    if (!wasIdle && isNowIdle && editingTimesheet.allocation?.id) {
      if (
        window.confirm(
          "Setting status to IDLE will unallocate this employee from the project. Continue?"
        )
      ) {
        // First update the timesheet, then unallocate
        updateMutation.mutate(
          { id: editingId, data: editForm },
          {
            onSuccess: () => {
              unallocateMutation.mutate(editingTimesheet.allocation!.id);
              setEditingId(null);
              setEditingTimesheet(null);
              setEditForm({});
            },
          }
        );
      }
      return;
    }

    // Case 2: Changing from idle to Active/On Hold - need to allocate to a project
    if (wasIdle && isNowActive) {
      if (!selectedProjectForAllocation) {
        setShowProjectSelect(true);
        return;
      }

      // Create allocation first, then update timesheet
      if (!editingTimesheet.employee?.id) {
        toast.error("Employee information is missing");
        return;
      }

      // Get the date from the timesheet
      const timesheetDate = editingTimesheet.date
        ? new Date(editingTimesheet.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      // Create allocations using bulk endpoint
      const createAllocationPromises = [
        axiosInstance.post("/project-allocations", {
          projectId: parseInt(selectedProjectForAllocation),
          employeeIds: [editingTimesheet.employee.id],
          startDate: timesheetDate,
          endDate: timesheetDate, // Same as startDate for single-day allocations
          notes: "Allocated from timesheet management",
        }),
      ];

      Promise.all(createAllocationPromises)
        .then(() => {
          // After allocation, update timesheet
          updateMutation.mutate(
            { id: editingId, data: editForm },
            {
              onSuccess: () => {
                toast.success("Employee allocated and timesheet updated!");
                queryClient.invalidateQueries({
                  queryKey: QUERY_KEYS.allocations.all,
                });
                cancelEdit();
              },
            }
          );
        })
        .catch((error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to allocate employee"
          );
        });
      return;
    }

    // Case 3: Normal update
    if (
      editForm.status === AttendanceStatus.ACTIVE &&
      (!editForm.hoursWorked || editForm.hoursWorked < 0)
    ) {
      toast.error("Hours worked must be provided for active status");
      return;
    }

    updateMutation.mutate(
      { id: editingId, data: editForm },
      {
        onSuccess: () => {
          cancelEdit();
        },
      }
    );
  };

  const remove = (id: number) => {
    if (window.confirm("Delete this timesheet entry?")) {
      deleteMutation.mutate(id);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.ACTIVE:
        return "success";
      case AttendanceStatus.ON_HOLD:
        return "warning";
      case AttendanceStatus.IDLE:
        return "light";
      default:
        return "light";
    }
  };

  // Get status display text
  const getStatusText = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.ACTIVE:
        return "Active";
      case AttendanceStatus.ON_HOLD:
        return "On Hold";
      case AttendanceStatus.IDLE:
        return "Idle";
      default:
        return status;
    }
  };

  // Separate idle employees (those with employeeId but no allocationId) from project timesheets
  const { projectTimesheets, idleTimesheets } = useMemo(() => {
    const project: Timesheet[] = [];
    const idle: Timesheet[] = [];

    filteredTimesheets.forEach((ts: Timesheet) => {
      // Idle employees have no allocation/project
      if (!ts.allocation || !ts.allocation.project) {
        idle.push(ts);
      } else {
        project.push(ts);
      }
    });

    return { projectTimesheets: project, idleTimesheets: idle };
  }, [filteredTimesheets]);

  // Group project timesheets by project-date, then by trade
  const groupedTimesheets = useMemo(() => {
    const groups: Record<
      string,
      {
        projectName: string;
        date: string;
        formattedDate: string;
        tradeGroups: Record<string, Timesheet[]>;
      }
    > = {};

    projectTimesheets.forEach((ts: Timesheet) => {
      const projectName = ts.allocation?.project?.name || "Unknown Project";
      const date = ts.date;
      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const key = `${projectName}-${date}`;

      if (!groups[key]) {
        groups[key] = {
          projectName,
          date,
          formattedDate,
          tradeGroups: {},
        };
      }

      const tradeName = ts.tradeInSite?.skill || "Unassigned";
      if (!groups[key].tradeGroups[tradeName]) {
        groups[key].tradeGroups[tradeName] = [];
      }
      groups[key].tradeGroups[tradeName].push(ts);
    });

    return groups;
  }, [projectTimesheets]);

  // Sort groups by date (most recent first)
  const sortedGroups = Object.entries(groupedTimesheets).sort((a, b) => {
    return new Date(b[1].date).getTime() - new Date(a[1].date).getTime();
  });

  // Group idle employees by date
  const idleByDate = useMemo(() => {
    const groups: Record<
      string,
      { date: string; formattedDate: string; employees: Timesheet[] }
    > = {};

    idleTimesheets.forEach((ts: Timesheet) => {
      const date = ts.date;
      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[date]) {
        groups[date] = { date, formattedDate, employees: [] };
      }
      groups[date].employees.push(ts);
    });

    return groups;
  }, [idleTimesheets]);

  const sortedIdleDates = Object.keys(idleByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <>
      <PageMeta
        title="Timesheets | ADAA Employment LLC"
        description="Manage employee timesheets and daily attendance"
      />
      <PermissionGuard
        permission="employee:read"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access timesheets.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="Timesheets" />

        {/* Statistics Cards - Compact */}
        {statsData && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total Hours
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {statsData.totalHours}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Active
              </div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {statsData.activeCount}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                On Hold
              </div>
              <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {statsData.onHoldCount}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Idle
              </div>
              <div className="text-xl font-bold text-gray-600 dark:text-gray-400">
                {statsData.idleCount}
              </div>
            </div>
          </div>
        )}

        {/* Compact Filters Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03] mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[150px]">
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="h-9 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">All Projects</option>
                {projectsData?.data?.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="h-9 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">All Employees</option>
                {employeesData?.data?.map((employee: any) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.adaa_emp_code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">All Statuses</option>
                <option value={AttendanceStatus.ACTIVE}>Active</option>
                <option value={AttendanceStatus.ON_HOLD}>On Hold</option>
                <option value={AttendanceStatus.IDLE}>Idle</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate("prev")}
                  className="px-2 h-9"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </Button>
                <div className="flex-1">
                  <DatePicker
                    id="startDate"
                    placeholder="Select date"
                    defaultDate={startDate ? new Date(startDate) : new Date()}
                    onChange={(_dates, dateStr) => {
                      setStartDate(dateStr);
                      setEndDate(dateStr);
                      // Auto-apply filters with new date
                      const newFilters: TimesheetFilters = {};
                      if (selectedProject)
                        newFilters.projectId = parseInt(selectedProject);
                      if (selectedEmployee)
                        newFilters.employeeId = parseInt(selectedEmployee);
                      if (selectedStatus)
                        newFilters.status = selectedStatus as AttendanceStatus;
                      newFilters.startDate = dateStr;
                      newFilters.endDate = dateStr;
                      setFilters(newFilters);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate("next")}
                  className="px-2 h-9"
                >
                  <AngleRightIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={applyFilters} size="sm" className="h-9">
                Apply
              </Button>
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="h-9"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Compact Header with Search Bar and Actions */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by employee, project, trade..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            {searchValue && (
              <Button
                onClick={clearSearch}
                variant="outline"
                size="sm"
                className="h-9"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total: {timesheetsData?.total || 0} entry(ies)
            </div>
            <PermissionGuard permission="employee:create">
              <Button
                onClick={() => navigate("/timesheets/daily")}
                startIcon={<PlusIcon />}
                size="sm"
                className="h-9"
              >
                Daily Management
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isLoading && sortedGroups.length > 0 && (
          <div className="space-y-8">
            {sortedGroups.map(([key, group]) => {
              const totalEntries = Object.values(group.tradeGroups).reduce(
                (sum, arr) => sum + arr.length,
                0
              );

              // Calculate statistics for active and on-hold employees
              const allTimesheets = Object.values(group.tradeGroups).flat();
              const activeTimesheets = allTimesheets.filter(
                (ts: Timesheet) => ts.status === AttendanceStatus.ACTIVE
              );
              const onHoldTimesheets = allTimesheets.filter(
                (ts: Timesheet) => ts.status === AttendanceStatus.ON_HOLD
              );

              const activeCount = activeTimesheets.length;
              const onHoldCount = onHoldTimesheets.length;
              const activeHours = activeTimesheets.reduce(
                (sum, ts: Timesheet) => sum + (Number(ts.hoursWorked) || 0),
                0
              );
              const onHoldHours = onHoldTimesheets.reduce(
                (sum, ts: Timesheet) => sum + (Number(ts.hoursWorked) || 0),
                0
              );

              return (
                <div
                  key={key}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Timesheet Header: Project - Date */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {group.projectName}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {group.formattedDate}
                        </p>
                        {(activeCount > 0 || onHoldCount > 0) && (
                          <div className="flex flex-wrap gap-4 mt-3 text-sm">
                            {activeCount > 0 && (
                              <div className="flex items-center gap-2">
                                <Badge color="success" size="sm">
                                  Active
                                </Badge>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {activeCount} employee
                                  {activeCount !== 1 ? "s" : ""} •{" "}
                                  {activeHours.toFixed(1)}h
                                </span>
                              </div>
                            )}
                            {onHoldCount > 0 && (
                              <div className="flex items-center gap-2">
                                <Badge color="warning" size="sm">
                                  On Hold
                                </Badge>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {onHoldCount} employee
                                  {onHoldCount !== 1 ? "s" : ""} •{" "}
                                  {onHoldHours.toFixed(1)}h
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge color="light" size="sm">
                        {totalEntries} employee(s)
                      </Badge>
                    </div>
                  </div>

                  {/* Group by Trade in Site */}
                  <div className="px-6 py-4 space-y-6">
                    {Object.entries(group.tradeGroups)
                      .sort((a, b) => {
                        if (a[0] === "Unassigned") return 1;
                        if (b[0] === "Unassigned") return -1;
                        return a[0].localeCompare(b[0]);
                      })
                      .map(([tradeName, timesheets]) => (
                        <div key={tradeName}>
                          {/* Trade Section Header */}
                          <div className="mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              {tradeName}
                              <Badge color="light" size="sm">
                                {timesheets.length}
                              </Badge>
                            </h3>
                          </div>

                          {/* Trade Section Table */}
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                  <TableCell
                                    isHeader
                                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                                  >
                                    Employee
                                  </TableCell>
                                  <TableCell
                                    isHeader
                                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                                  >
                                    Trade in Site
                                  </TableCell>
                                  <TableCell
                                    isHeader
                                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                                  >
                                    Hours
                                  </TableCell>
                                  <TableCell
                                    isHeader
                                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                                  >
                                    Status
                                  </TableCell>
                                  <TableCell
                                    isHeader
                                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                                  >
                                    Notes
                                  </TableCell>
                                  <TableCell
                                    isHeader
                                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                                  >
                                    Actions
                                  </TableCell>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {timesheets.map((ts: Timesheet) => {
                                  const isEditing = editingId === ts.id;
                                  const empData = ts.allocation?.employee;

                                  return (
                                    <TableRow
                                      key={ts.id}
                                      className={
                                        isEditing
                                          ? "bg-blue-50 dark:bg-blue-900/10"
                                          : ""
                                      }
                                    >
                                      <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                                        {empData?.name || "—"}
                                        <br />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {empData?.adaa_emp_code || ""}
                                        </span>
                                      </TableCell>
                                      <TableCell className="px-5 py-4 text-start">
                                        {isEditing ? (
                                          <div className="space-y-2">
                                            <select
                                              value={
                                                editForm.tradeInSiteId || ""
                                              }
                                              onChange={(e) =>
                                                setEditForm({
                                                  ...editForm,
                                                  tradeInSiteId: e.target.value
                                                    ? parseInt(e.target.value)
                                                    : undefined,
                                                })
                                              }
                                              className="min-w-[150px] h-11 appearance-none rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700"
                                            >
                                              <option value="">
                                                Select skill
                                              </option>
                                              {skillsData?.data?.map(
                                                (skill: any) => (
                                                  <option
                                                    key={skill.id}
                                                    value={skill.id}
                                                  >
                                                    {skill.skill}
                                                  </option>
                                                )
                                              )}
                                            </select>
                                            {showProjectSelect &&
                                              editingTimesheet?.status ===
                                                AttendanceStatus.IDLE && (
                                                <select
                                                  value={
                                                    selectedProjectForAllocation
                                                  }
                                                  onChange={(e) =>
                                                    setSelectedProjectForAllocation(
                                                      e.target.value
                                                    )
                                                  }
                                                  className="min-w-[150px] h-11 appearance-none rounded-lg border border-brand-500 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700"
                                                >
                                                  <option value="">
                                                    ⚠️ Select project *
                                                  </option>
                                                  {projectsData?.data?.map(
                                                    (project: any) => (
                                                      <option
                                                        key={project.id}
                                                        value={project.id}
                                                      >
                                                        {project.name}
                                                      </option>
                                                    )
                                                  )}
                                                </select>
                                              )}
                                          </div>
                                        ) : (
                                          <span className="text-gray-900 dark:text-gray-100">
                                            {ts.tradeInSite?.skill || "—"}
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="px-5 py-4 text-start">
                                        {isEditing ? (
                                          <Input
                                            type="number"
                                            min="0"
                                            step={1}
                                            value={editForm.hoursWorked || ""}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                hoursWorked:
                                                  parseFloat(e.target.value) ||
                                                  0,
                                              })
                                            }
                                            className="w-24"
                                          />
                                        ) : (
                                          <span className="text-gray-900 dark:text-gray-100">
                                            {ts.hoursWorked}h
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="px-5 py-4 text-start">
                                        {isEditing ? (
                                          <select
                                            value={editForm.status || ""}
                                            onChange={(e) => {
                                              const newStatus = e.target
                                                .value as AttendanceStatus;
                                              setEditForm({
                                                ...editForm,
                                                status: newStatus,
                                                hoursWorked:
                                                  getDefaultHours(newStatus),
                                              });
                                              // Show project selector if changing from idle to active
                                              if (
                                                editingTimesheet?.status ===
                                                  AttendanceStatus.IDLE &&
                                                newStatus !==
                                                  AttendanceStatus.IDLE
                                              ) {
                                                setShowProjectSelect(true);
                                              } else {
                                                setShowProjectSelect(false);
                                              }
                                            }}
                                            className="min-w-[120px] h-11 appearance-none rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700"
                                          >
                                            <option
                                              value={AttendanceStatus.ACTIVE}
                                            >
                                              Active
                                            </option>
                                            <option
                                              value={AttendanceStatus.ON_HOLD}
                                            >
                                              On Hold
                                            </option>
                                            <option
                                              value={AttendanceStatus.IDLE}
                                            >
                                              Idle
                                            </option>
                                          </select>
                                        ) : (
                                          <Badge
                                            color={getStatusBadgeColor(
                                              ts.status
                                            )}
                                            size="sm"
                                          >
                                            {getStatusText(ts.status)}
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="px-5 py-4 text-start">
                                        {isEditing ? (
                                          <Input
                                            type="text"
                                            value={editForm.notes || ""}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                notes: e.target.value,
                                              })
                                            }
                                            placeholder="Notes"
                                            className="min-w-[150px]"
                                          />
                                        ) : (
                                          ts.notes || "—"
                                        )}
                                      </TableCell>
                                      <TableCell className="px-5 py-4 text-start">
                                        {isEditing ? (
                                          <div className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={saveEdit}
                                            >
                                              Save
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={cancelEdit}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => startEdit(ts)}
                                            >
                                              Edit
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                              onClick={() => remove(ts.id)}
                                            >
                                              Delete
                                            </Button>
                                          </div>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Idle Employees Section */}
        {!isLoading && sortedIdleDates.length > 0 && (
          <div className="space-y-8 mt-8">
            <div className="border-t border-gray-300 dark:border-gray-600 pt-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Idle Employees (Not on Projects)
              </h2>
            </div>

            {sortedIdleDates.map((date) => {
              const group = idleByDate[date];
              return (
                <div
                  key={date}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Date Header */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Idle Employees
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {group.formattedDate}
                        </p>
                      </div>
                      <Badge color="light" size="sm">
                        {group.employees.length} employee(s)
                      </Badge>
                    </div>
                  </div>

                  {/* Idle Employees Table */}
                  <div className="px-6 py-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                          <TableRow>
                            <TableCell
                              isHeader
                              className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                            >
                              Employee
                            </TableCell>
                            <TableCell
                              isHeader
                              className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                            >
                              Actual Trade
                            </TableCell>
                            <TableCell
                              isHeader
                              className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                            >
                              Trade in Site
                            </TableCell>
                            <TableCell
                              isHeader
                              className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                            >
                              Project
                            </TableCell>
                            <TableCell
                              isHeader
                              className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                            >
                              Hours
                            </TableCell>
                            <TableCell
                              isHeader
                              className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                            >
                              Status
                            </TableCell>
                            <TableCell
                              isHeader
                              className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                            >
                              Notes
                            </TableCell>
                            <TableCell
                              isHeader
                              className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                            >
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                          {group.employees.map((ts: Timesheet) => {
                            const empData =
                              ts.employee || ts.allocation?.employee;
                            const isEditing = editingId === ts.id;

                            return (
                              <TableRow
                                key={ts.id}
                                className={
                                  isEditing
                                    ? "bg-blue-50 dark:bg-blue-900/10"
                                    : ""
                                }
                              >
                                <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                                  {empData?.name || "—"}
                                  <br />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {empData?.adaa_emp_code || ""}
                                  </span>
                                </TableCell>
                                <TableCell className="px-5 py-4 text-start">
                                  <div className="flex flex-wrap gap-1">
                                    {empData?.employeeSkills &&
                                    empData.employeeSkills.length > 0 ? (
                                      empData.employeeSkills.map((es: any) => (
                                        <Badge
                                          key={es.id}
                                          color="light"
                                          size="sm"
                                        >
                                          {es.skill?.skill}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-gray-500 dark:text-gray-400">
                                        —
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="px-5 py-4 text-start">
                                  {isEditing ? (
                                    <select
                                      value={editForm.tradeInSiteId || ""}
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          tradeInSiteId: e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                        })
                                      }
                                      className="min-w-[150px] h-11 appearance-none rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700"
                                    >
                                      <option value="">Select skill</option>
                                      {skillsData?.data?.map((skill: any) => (
                                        <option key={skill.id} value={skill.id}>
                                          {skill.skill}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {ts.tradeInSite?.skill || "—"}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="px-5 py-4 text-start">
                                  {isEditing ? (
                                    <select
                                      value={selectedProjectForAllocation}
                                      onChange={(e) =>
                                        setSelectedProjectForAllocation(
                                          e.target.value
                                        )
                                      }
                                      className="min-w-[150px] h-11 appearance-none rounded-lg border border-brand-500 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700"
                                      required={
                                        editForm.status !==
                                          AttendanceStatus.IDLE &&
                                        editForm.status !== undefined
                                      }
                                    >
                                      <option value="">
                                        {editForm.status !==
                                          AttendanceStatus.IDLE &&
                                        editForm.status
                                          ? "⚠️ Select project *"
                                          : "Select project"}
                                      </option>
                                      {projectsData?.data?.map(
                                        (project: any) => (
                                          <option
                                            key={project.id}
                                            value={project.id}
                                          >
                                            {project.name}
                                          </option>
                                        )
                                      )}
                                    </select>
                                  ) : (
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {ts.allocation?.project?.name || "—"}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="px-5 py-4 text-start">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      step={1}
                                      value={editForm.hoursWorked || ""}
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          hoursWorked:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-24"
                                    />
                                  ) : (
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {ts.hoursWorked}h
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="px-5 py-4 text-start">
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <select
                                        value={editForm.status || ""}
                                        onChange={(e) => {
                                          const newStatus = e.target
                                            .value as AttendanceStatus;
                                          setEditForm({
                                            ...editForm,
                                            status: newStatus,
                                            hoursWorked:
                                              getDefaultHours(newStatus),
                                          });
                                          // Show project selector if changing from idle to active
                                          if (
                                            editingTimesheet?.status ===
                                              AttendanceStatus.IDLE &&
                                            newStatus !== AttendanceStatus.IDLE
                                          ) {
                                            setShowProjectSelect(true);
                                          } else if (
                                            newStatus === AttendanceStatus.IDLE
                                          ) {
                                            setShowProjectSelect(false);
                                          }
                                        }}
                                        className="min-w-[120px] h-11 appearance-none rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700"
                                      >
                                        <option value={AttendanceStatus.ACTIVE}>
                                          Active
                                        </option>
                                        <option
                                          value={AttendanceStatus.ON_HOLD}
                                        >
                                          On Hold
                                        </option>
                                        <option value={AttendanceStatus.IDLE}>
                                          Idle
                                        </option>
                                      </select>
                                    </div>
                                  ) : (
                                    <Badge
                                      color={getStatusBadgeColor(ts.status)}
                                      size="sm"
                                    >
                                      {getStatusText(ts.status)}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="px-5 py-4 text-start">
                                  {isEditing ? (
                                    <Input
                                      type="text"
                                      value={editForm.notes || ""}
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          notes: e.target.value,
                                        })
                                      }
                                      placeholder="Notes"
                                      className="min-w-[150px]"
                                    />
                                  ) : (
                                    ts.notes || "—"
                                  )}
                                </TableCell>
                                <TableCell className="px-5 py-4 text-start">
                                  {isEditing ? (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={saveEdit}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={cancelEdit}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => startEdit(ts)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                        onClick={() => remove(ts.id)}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filteredTimesheets.length === 0 && searchValue && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No timesheets found matching "{searchValue}"
            </p>
            <Button onClick={clearSearch} variant="outline">
              Clear Search
            </Button>
          </div>
        )}

        {!isLoading &&
          timesheetsData?.data.length === 0 &&
          !searchValue &&
          Object.keys(filters).length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No timesheets found. Start by creating a timesheet entry.
              </p>
              <Button onClick={() => navigate("/timesheets/daily")}>
                Go to Daily Management
              </Button>
            </div>
          )}

        {!isLoading &&
          filteredTimesheets.length === 0 &&
          Object.keys(filters).length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No timesheets found matching the selected filters.
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}
      </PermissionGuard>
    </>
  );
}
