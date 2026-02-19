import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { timesheetsApi } from "../services/api/timesheetsApi";
import { QUERY_KEYS } from "../lib/constants";
import {
  TimesheetStatus,
  DailyHours,
  MonthlyProjectTimesheetData,
  IDLE_PROJECT_ID,
} from "../types/timesheet";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import TimesheetExportModal from "../components/timesheets/TimesheetExportModal";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  PaperPlaneIcon,
  CheckLineIcon,
  CloseIcon,
  DownloadIcon,
  LockIcon,
  AlertIcon,
} from "../icons";

interface DayEdit {
  hours: number;
  status?: string;
}

interface ProjectEdits {
  [projectId: number]: Map<string, DayEdit>;
}

export default function MonthlyProjectTimesheets() {
  const queryClient = useQueryClient();

  // Get current month as default
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(
    new Set()
  );
  const [projectEdits, setProjectEdits] = useState<ProjectEdits>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Set<number>>(
    new Set()
  );
  const [exportProjectId, setExportProjectId] = useState<number | null>(null);
  const [unlockedApprovedProjects, setUnlockedApprovedProjects] = useState<
    Set<number>
  >(new Set());
  const [unlockConfirmProjectId, setUnlockConfirmProjectId] = useState<
    number | null
  >(null);
  const [editingStatusCell, setEditingStatusCell] = useState<string | null>(
    null
  );
  const [editingHoursCell, setEditingHoursCell] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [discrepancyMenuCell, setDiscrepancyMenuCell] = useState<string | null>(null);

  // Fetch ALL project timesheets in a single API call
  const { data: allTimesheetsData, isLoading: isTimesheetsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.timesheets.all, "all-projects", selectedMonth],
    queryFn: () => timesheetsApi.getAllProjectTimesheets(selectedMonth),
    enabled: !!selectedMonth,
  });

  // Build a lookup map: projectId -> timesheetData
  const timesheetsByProject = useMemo(() => {
    const map = new Map<number, MonthlyProjectTimesheetData>();
    if (allTimesheetsData) {
      for (const data of allTimesheetsData) {
        map.set(data.project.id, data);
      }
    }
    return map;
  }, [allTimesheetsData]);

  // Get project IDs from the response (ordered by backend)
  const projectIds = useMemo(
    () => allTimesheetsData?.map((d) => d.project.id) || [],
    [allTimesheetsData]
  );

  // Search: match by employee id, name, or project name; compute highlight set
  const { matchingEmployeeIds, filteredProjectIds } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchingIds = new Set<number>();
    if (!allTimesheetsData) {
      return {
        matchingEmployeeIds: matchingIds,
        filteredProjectIds: projectIds,
      };
    }
    if (!q) {
      return {
        matchingEmployeeIds: matchingIds,
        filteredProjectIds: projectIds,
      };
    }
    for (const data of allTimesheetsData) {
      const projectNameMatches = data.project.name
        .toLowerCase()
        .includes(q);
      for (const emp of data.employees) {
        const idMatches =
          (emp.idNo && emp.idNo.toString().toLowerCase().includes(q)) ?? false;
        const nameMatches =
          (emp.name && emp.name.toLowerCase().includes(q)) ?? false;
        if (idMatches || nameMatches) {
          matchingIds.add(emp.employeeId);
        }
      }
    }
    const filtered = allTimesheetsData.filter((data) => {
      if (data.project.name.toLowerCase().includes(q)) return true;
      return data.employees.some((emp) => matchingIds.has(emp.employeeId));
    });
    return {
      matchingEmployeeIds: matchingIds,
      filteredProjectIds: filtered.map((d) => d.project.id),
    };
  }, [allTimesheetsData, projectIds, searchQuery]);

  // When search matches an employee, auto-expand those projects so the highlighted row is visible
  useEffect(() => {
    if (matchingEmployeeIds.size > 0 && filteredProjectIds.length > 0) {
      setExpandedProjects(
        (prev) => new Set([...prev, ...filteredProjectIds])
      );
    }
  }, [matchingEmployeeIds.size, filteredProjectIds.join(",")]);

  // Close discrepancy menu on click outside
  useEffect(() => {
    if (!discrepancyMenuCell) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-discrepancy-menu]") && !target.closest("[data-discrepancy-trigger]")) {
        setDiscrepancyMenuCell(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [discrepancyMenuCell]);

  // Create timesheet mutation
  const createTimesheetMutation = useMutation({
    mutationFn: timesheetsApi.createOrGetTimesheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timesheets.all });
    },
  });

  // Save entries mutation
  const saveEntriesMutation = useMutation({
    mutationFn: ({ timesheetId, entries }: any) =>
      timesheetsApi.saveTimesheetEntries(timesheetId, { entries }),
    onSuccess: (_, variables) => {
      toast.success("Timesheet saved successfully!");
      // Remove from unsaved changes
      setHasUnsavedChanges((prev) => {
        const newSet = new Set(prev);
        // Find project ID from timesheet
        if (allTimesheetsData) {
          for (const data of allTimesheetsData) {
            if (data.timesheet?.id === variables.timesheetId) {
              newSet.delete(data.project.id);
            }
          }
        }
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timesheets.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save timesheet");
    },
  });

  // Submit timesheet mutation
  const submitTimesheetMutation = useMutation({
    mutationFn: ({ timesheetId, notes }: any) =>
      timesheetsApi.submitTimesheet(timesheetId, { notes }),
    onSuccess: () => {
      toast.success("Timesheet submitted for approval!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timesheets.all });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to submit timesheet"
      );
    },
  });

  // Approve timesheet mutation
  const approveTimesheetMutation = useMutation({
    mutationFn: ({ timesheetId, status, notes }: any) =>
      timesheetsApi.approveTimesheet(timesheetId, { status, notes }),
    onSuccess: () => {
      toast.success("Timesheet status updated!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timesheets.all });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update timesheet"
      );
    },
  });

  // Sync mobilization from timesheet entry (use timesheet as source of truth)
  const syncMobilizationFromEntryMutation = useMutation({
    mutationFn: (entryId: number) =>
      timesheetsApi.syncMobilizationFromEntry(entryId),
    onSuccess: () => {
      toast.success("Mobilization updated to match timesheet.");
      setDiscrepancyMenuCell(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timesheets.all });
    },
    onError: (error: any) =>
      toast.error(
        error.response?.data?.message || "Failed to sync mobilization"
      ),
  });

  // Remove entry so cell shows mobilization data (use mobilization as source of truth)
  const removeEntryUseMobilizationMutation = useMutation({
    mutationFn: (entryId: number) =>
      timesheetsApi.removeEntryUseMobilization(entryId),
    onSuccess: () => {
      toast.success("Entry removed; cell will show mobilization data.");
      setDiscrepancyMenuCell(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timesheets.all });
    },
    onError: (error: any) =>
      toast.error(
        error.response?.data?.message || "Failed to sync timesheet"
      ),
  });

  const getDaysInMonth = (month: string) => {
    const [year, monthNum] = month.split("-").map(Number);
    return new Date(year, monthNum, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const toggleProject = (projectId: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Job status options with default hours and abbreviations
  const jobStatusOptions = [
    { value: "active", label: "Active", defaultHours: 10, abbr: "Act" },
    { value: "idle", label: "Idle", defaultHours: 8, abbr: "Idl" },
    {
      value: "notice_period",
      label: "Notice Period",
      defaultHours: 10,
      abbr: "NP",
    },
    {
      value: "annual_leave",
      label: "Annual Leave",
      defaultHours: 0,
      abbr: "AL",
    },
    { value: "absent", label: "Absent", defaultHours: 0, abbr: "A" },
    { value: "sick_leave", label: "Sick Leave", defaultHours: 0, abbr: "SL" },
    {
      value: "casual_leave",
      label: "Casual Leave",
      defaultHours: 0,
      abbr: "CL",
    },
    {
      value: "urgent_leave",
      label: "Urgent Leave",
      defaultHours: 0,
      abbr: "UL",
    },
    { value: "off", label: "Off", defaultHours: 0, abbr: "Off" },
    { value: "cancelled", label: "Cancelled", defaultHours: 0, abbr: "Cnx" },
    { value: "absconded", label: "Absconded", defaultHours: 0, abbr: "Abn" },
    { value: "resigned", label: "Resigned", defaultHours: 0, abbr: "Res" },
  ];

  const getStatusAbbreviation = (status: string): string => {
    const option = jobStatusOptions.find((opt) => opt.value === status);
    return option?.abbr ?? status.substring(0, 3).toUpperCase();
  };

  const getDefaultHoursForStatus = (status: string): number => {
    const option = jobStatusOptions.find((opt) => opt.value === status);
    return option?.defaultHours ?? 10;
  };

  const handleStatusChange = (
    projectId: number,
    employeeId: number,
    date: string,
    newStatus: string
  ) => {
    const key = `${employeeId}-${date}`;
    const defaultHours = getDefaultHoursForStatus(newStatus);

    setProjectEdits((prev: ProjectEdits) => {
      const projectMap = new Map(prev[projectId] || new Map());
      projectMap.set(key, { hours: defaultHours, status: newStatus });
      return {
        ...prev,
        [projectId]: projectMap,
      };
    });

    setHasUnsavedChanges((prev) => new Set(prev).add(projectId));
    setEditingStatusCell(null); // Close status editor after selection
  };

  const handleCellDoubleClick = (
    projectId: number,
    employeeId: number,
    date: string,
    currentStatus: string | null
  ) => {
    const key = `${projectId}-${employeeId}-${date}`;
    setEditingStatusCell(key);

    // If current status is null, initialize with "active"
    if (currentStatus === null) {
      const cellKey = `${employeeId}-${date}`;
      setProjectEdits((prev: ProjectEdits) => {
        const projectMap = new Map(prev[projectId] || new Map());
        projectMap.set(cellKey, { hours: 10, status: "active" });
        return {
          ...prev,
          [projectId]: projectMap,
        };
      });
      setHasUnsavedChanges((prev) => new Set(prev).add(projectId));
    }
  };

  const handleHoursChange = (
    projectId: number,
    employeeId: number,
    date: string,
    hours: number,
    currentStatus: string
  ) => {
    const key = `${employeeId}-${date}`;

    setProjectEdits((prev: ProjectEdits) => {
      const projectMap = new Map(prev[projectId] || new Map());
      const existing = projectMap.get(key);
      projectMap.set(key, { hours, status: existing?.status || currentStatus });
      return {
        ...prev,
        [projectId]: projectMap,
      };
    });

    setHasUnsavedChanges((prev) => new Set(prev).add(projectId));
  };

  const getHoursValue = (
    projectId: number,
    employeeId: number,
    dailyHours: DailyHours
  ): number => {
    const key = `${employeeId}-${dailyHours.date}`;
    const edits = projectEdits[projectId];
    return edits?.has(key) ? edits.get(key)!.hours : dailyHours.hoursWorked;
  };

  const getStatusValue = (
    projectId: number,
    employeeId: number,
    dailyHours: DailyHours
  ): string => {
    const key = `${employeeId}-${dailyHours.date}`;
    const edits = projectEdits[projectId];
    const editStatus = edits?.has(key) ? edits.get(key)!.status : undefined;
    return editStatus || dailyHours.jobStatus || "active";
  };

  const handleSave = async (projectId: number, timesheetData: any) => {
    if (!timesheetData) return;

    try {
      // Create timesheet if it doesn't exist
      let timesheetId = timesheetData.timesheet?.id;
      if (!timesheetId) {
        const newTimesheet = await createTimesheetMutation.mutateAsync({
          projectId: projectId === IDLE_PROJECT_ID ? null : projectId,
          month: selectedMonth,
        });
        timesheetId = newTimesheet.id;
      }

      // Prepare entries
      const entries: any[] = [];
      const edits = projectEdits[projectId] || new Map();

      timesheetData.employees.forEach((employee: any) => {
        employee.dailyHours.forEach((dailyHour: any) => {
          if (dailyHour.jobStatus && dailyHour.jobStatus !== "demobilized") {
            const key = `${employee.employeeId}-${dailyHour.date}`;
            const edit = edits.get(key);
            const hours = edit?.hours ?? dailyHour.hoursWorked;
            const status = edit?.status ?? dailyHour.jobStatus;

            entries.push({
              employeeId: employee.employeeId,
              date: dailyHour.date,
              hoursWorked: hours,
              jobStatus: status,
              notes: dailyHour.notes,
            });
          }
        });
      });

      await saveEntriesMutation.mutateAsync({ timesheetId, entries });

      // Clear edits for this project
      setProjectEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[projectId];
        return newEdits;
      });
    } catch (error) {
      console.error("Error saving timesheet:", error);
    }
  };

  const handleSubmit = async (projectId: number, timesheetData: any) => {
    if (!timesheetData) return;

    try {
      // Create timesheet if it doesn't exist and/or save entries
      let timesheetId = timesheetData.timesheet?.id;
      const hasChanges = hasUnsavedChanges.has(projectId);

      if (!timesheetId) {
        const newTimesheet = await createTimesheetMutation.mutateAsync({
          projectId: projectId === IDLE_PROJECT_ID ? null : projectId,
          month: selectedMonth,
        });
        timesheetId = newTimesheet.id;
      }

      // Save entries if there are changes
      if (hasChanges || !timesheetData.timesheet?.id) {
        const entries: any[] = [];
        const edits = projectEdits[projectId] || new Map();

        timesheetData.employees.forEach((employee: any) => {
          employee.dailyHours.forEach((dailyHour: any) => {
            if (dailyHour.jobStatus && dailyHour.jobStatus !== "demobilized") {
              const key = `${employee.employeeId}-${dailyHour.date}`;
              const edit = edits.get(key);
              const hours = edit?.hours ?? dailyHour.hoursWorked;
              const status = edit?.status ?? dailyHour.jobStatus;

              entries.push({
                employeeId: employee.employeeId,
                date: dailyHour.date,
                hoursWorked: hours,
                jobStatus: status,
                notes: dailyHour.notes,
              });
            }
          });
        });

        await saveEntriesMutation.mutateAsync({ timesheetId, entries });

        // Clear edits for this project
        setProjectEdits((prev) => {
          const newEdits = { ...prev };
          delete newEdits[projectId];
          return newEdits;
        });
      }

      // Submit the timesheet
      await submitTimesheetMutation.mutateAsync({ timesheetId });
    } catch (error) {
      console.error("Error submitting timesheet:", error);
    }
  };

  const handleApprove = async (
    timesheetId: number,
    status: TimesheetStatus.APPROVED | TimesheetStatus.REJECTED
  ) => {
    await approveTimesheetMutation.mutateAsync({ timesheetId, status });
  };

  const handleUnlockApproved = (projectId: number) => {
    setUnlockedApprovedProjects((prev) => new Set(prev).add(projectId));
    setUnlockConfirmProjectId(null);
    toast.info(
      "Timesheet unlocked for editing. Remember to resubmit after changes."
    );
  };

  const getStatusBadgeColor = (status: TimesheetStatus) => {
    switch (status) {
      case TimesheetStatus.DRAFT:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case TimesheetStatus.SUBMITTED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case TimesheetStatus.APPROVED:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case TimesheetStatus.REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isLoading = isTimesheetsLoading;

  return (
    <PermissionGuard permissions={["view_timesheets"]}>
      <PageMeta
        title="Monthly Project Timesheets"
        description="Manage employee hours by project for the selected month"
      />

      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Monthly Project Timesheets" />

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Monthly Project Timesheets
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage employee hours by project for the selected month
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="w-64">
                <Label htmlFor="month">Month</Label>
                <input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setProjectEdits({});
                    setHasUnsavedChanges(new Set());
                    setExpandedProjects(new Set());
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1 min-w-[200px] max-w-md">
                <Label htmlFor="timesheet-search">Search</Label>
                <input
                  id="timesheet-search"
                  type="text"
                  placeholder="Employee ID, name, or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                           focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Loading timesheets...
              </span>
            </div>
          </div>
        )}

        {/* Project Accordions */}
        {!isLoading && (
          <div className="space-y-4">
            {filteredProjectIds.map((projectId) => {
              const timesheetData = timesheetsByProject.get(projectId);

              if (!timesheetData) return null;
              const isIdle = projectId === IDLE_PROJECT_ID;
              if (!isIdle && timesheetData.employees.length === 0) return null;

              // When search matched employees, show only those in this project; otherwise show all
              const employeesToShow =
                matchingEmployeeIds.size > 0
                  ? timesheetData.employees.filter((e: any) =>
                      matchingEmployeeIds.has(e.employeeId)
                    )
                  : timesheetData.employees;

              if (!isIdle && employeesToShow.length === 0) return null;

              const isExpanded = expandedProjects.has(projectId);
              const hasChanges = hasUnsavedChanges.has(projectId);
              const status =
                timesheetData.timesheet?.status || TimesheetStatus.DRAFT;
              const isSubmitted = status === TimesheetStatus.SUBMITTED;
              const isApproved =
                status === TimesheetStatus.APPROVED ||
                status === TimesheetStatus.REJECTED;
              const isUnlocked = unlockedApprovedProjects.has(projectId);
              const canEdit =
                status !== TimesheetStatus.SUBMITTED &&
                (!isApproved || isUnlocked);

              return (
                <div
                  key={projectId}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Project Header */}
                  <button
                    onClick={() => toggleProject(projectId)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {timesheetData.project.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isIdle
                            ? ""
                            : `${timesheetData.project.client.name} • `}
                          {employeesToShow.length} employee
                          {employeesToShow.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          status
                        )}`}
                      >
                        {status.toUpperCase()}
                      </span>
                      {hasChanges && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Unsaved
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Project Timesheet Table */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {/* Action Buttons */}
                      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                        <Button
                          onClick={() => setExportProjectId(projectId)}
                          variant="outline"
                          size="sm"
                          startIcon={<DownloadIcon />}
                        >
                          Export
                        </Button>

                        <div className="flex gap-2">
                          {isApproved && !isUnlocked && (
                            <Button
                              onClick={() =>
                                setUnlockConfirmProjectId(projectId)
                              }
                              variant="outline"
                              size="sm"
                              startIcon={<LockIcon />}
                            >
                              Unlock
                            </Button>
                          )}
                          {canEdit && (
                            <>
                              <Button
                                onClick={() =>
                                  handleSave(projectId, timesheetData)
                                }
                                disabled={
                                  !hasChanges || saveEntriesMutation.isPending
                                }
                                size="sm"
                                startIcon={<CheckCircleIcon />}
                              >
                                {saveEntriesMutation.isPending
                                  ? "Saving..."
                                  : "Save"}
                              </Button>
                              <Button
                                onClick={() =>
                                  handleSubmit(projectId, timesheetData)
                                }
                                variant="primary"
                                size="sm"
                                disabled={submitTimesheetMutation.isPending}
                                startIcon={<PaperPlaneIcon />}
                              >
                                {submitTimesheetMutation.isPending
                                  ? "Submitting..."
                                  : "Submit"}
                              </Button>
                            </>
                          )}
                          {isSubmitted && (
                            <>
                              <Button
                                onClick={() =>
                                  handleApprove(
                                    timesheetData.timesheet!.id,
                                    TimesheetStatus.REJECTED
                                  )
                                }
                                variant="outline"
                                size="sm"
                                disabled={approveTimesheetMutation.isPending}
                                startIcon={<CloseIcon />}
                              >
                                Reject
                              </Button>
                              <Button
                                onClick={() =>
                                  handleApprove(
                                    timesheetData.timesheet!.id,
                                    TimesheetStatus.APPROVED
                                  )
                                }
                                variant="primary"
                                size="sm"
                                disabled={approveTimesheetMutation.isPending}
                                startIcon={<CheckLineIcon />}
                              >
                                Approve
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                          <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                              <th
                                className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-900/50 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-700"
                                style={{ minWidth: "40px", width: "40px" }}
                              >
                                Sr
                              </th>
                              <th
                                className="sticky left-[40px] z-20 bg-gray-50 dark:bg-gray-900/50 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-700"
                                style={{ minWidth: "90px", width: "90px" }}
                              >
                                ID No
                              </th>
                              <th
                                className="sticky left-[130px] z-20 bg-gray-50 dark:bg-gray-900/50 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-700"
                                style={{ minWidth: "150px", width: "150px" }}
                              >
                                Name
                              </th>
                              <th
                                className="sticky left-[280px] z-20 bg-gray-50 dark:bg-gray-900/50 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-700"
                                style={{ minWidth: "120px", width: "120px" }}
                              >
                                Trade
                              </th>
                              {days.map((day) => (
                                <th
                                  key={day}
                                  className="px-0.5 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-r border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                                  style={{ minWidth: "45px", width: "45px" }}
                                >
                                  {day}
                                </th>
                              ))}
                              <th
                                className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                                style={{ minWidth: "70px", width: "70px" }}
                              >
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800">
                            {employeesToShow.map((employee: any) => {
                              // Calculate total hours for this employee
                              const employeeTotal = Math.round(
                                employee.dailyHours.reduce(
                                  (sum: number, dh: any) => {
                                    if (
                                      dh.jobStatus &&
                                      dh.jobStatus !== "demobilized" &&
                                      dh.jobStatus !== null
                                    ) {
                                      const hoursValue = getHoursValue(
                                        projectId,
                                        employee.employeeId,
                                        dh
                                      );
                                      return sum + hoursValue;
                                    }
                                    return sum;
                                  },
                                  0
                                )
                              );

                              return (
                                <tr
                                  key={employee.employeeId}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700"
                                >
                                  <td
                                    className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 whitespace-nowrap"
                                    style={{ minWidth: "40px", width: "40px" }}
                                  >
                                    {employee.srNo}
                                  </td>
                                  <td
                                    className="sticky left-[40px] z-10 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 whitespace-nowrap"
                                    style={{ minWidth: "90px", width: "90px" }}
                                  >
                                    {employee.idNo}
                                  </td>
                                  <td
                                    className="sticky left-[130px] z-10 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700"
                                    style={{
                                      minWidth: "150px",
                                      width: "150px",
                                    }}
                                  >
                                    <div
                                      className="truncate"
                                      title={employee.name}
                                    >
                                      {employee.name}
                                    </div>
                                  </td>
                                  <td
                                    className="sticky left-[280px] z-10 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700"
                                    style={{
                                      minWidth: "120px",
                                      width: "120px",
                                    }}
                                  >
                                    <div
                                      className="truncate"
                                      title={employee.trade}
                                    >
                                      {employee.trade}
                                    </div>
                                  </td>
                                  {days.map((day) => {
                                    // Find the dailyHour entry for this specific day
                                    const dailyHour = employee.dailyHours.find(
                                      (dh: any) => dh.day === day
                                    );
                                    const hoursValue = dailyHour
                                      ? Math.round(
                                          getHoursValue(
                                            projectId,
                                            employee.employeeId,
                                            dailyHour
                                          )
                                        )
                                      : 0;
                                    const statusValue = dailyHour
                                      ? getStatusValue(
                                          projectId,
                                          employee.employeeId,
                                          dailyHour
                                        )
                                      : "active";
                                    const isZero = hoursValue === 0;
                                    const isNoticePeriod =
                                      statusValue === "notice_period";
                                    const isOffDay = statusValue === "off";

                                    // Determine color based on status
                                    let colorClass = "";
                                    if (isZero) {
                                      colorClass =
                                        "text-red-600 dark:text-red-400";
                                    } else if (isNoticePeriod) {
                                      colorClass =
                                        "text-orange-600 dark:text-orange-400";
                                    } else {
                                      colorClass =
                                        "text-green-600 dark:text-green-400";
                                    }

                                    // Background color for off days
                                    const bgClass = isOffDay
                                      ? "bg-orange-50 dark:bg-orange-900/20"
                                      : "";

                                    return (
                                      <td
                                        key={day}
                                        className={`px-0.5 py-1 text-center border-r border-gray-200 dark:border-gray-700 ${bgClass}`}
                                        style={{
                                          minWidth: "60px",
                                          width: "60px",
                                        }}
                                        onDoubleClick={() =>
                                          canEdit &&
                                          dailyHour &&
                                          handleCellDoubleClick(
                                            projectId,
                                            employee.employeeId,
                                            dailyHour.date,
                                            dailyHour.jobStatus
                                          )
                                        }
                                      >
                                        <div className={dailyHour ? "relative" : ""}>
                                        {(() => {
                                          if (!dailyHour) {
                                            return (
                                              <span className="text-xs text-gray-400 dark:text-gray-600">
                                                -
                                              </span>
                                            );
                                          }

                                          const cellKey = `${projectId}-${employee.employeeId}-${dailyHour.date}`;
                                          const isEditingStatus =
                                            editingStatusCell === cellKey;
                                          const isEditingHours =
                                            editingHoursCell === cellKey;

                                          // Show status dropdown when double-clicked
                                          if (isEditingStatus) {
                                            return (
                                              <select
                                                autoFocus
                                                value={statusValue}
                                                onChange={(e) =>
                                                  handleStatusChange(
                                                    projectId,
                                                    employee.employeeId,
                                                    dailyHour.date,
                                                    e.target.value
                                                  )
                                                }
                                                onBlur={() =>
                                                  setEditingStatusCell(null)
                                                }
                                                className="w-full px-0.5 py-0.5 text-xs border border-brand-500 dark:border-brand-400 rounded
                                                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                                       focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                                              >
                                                {jobStatusOptions.map((opt) => (
                                                  <option
                                                    key={opt.value}
                                                    value={opt.value}
                                                  >
                                                    {opt.label}
                                                  </option>
                                                ))}
                                              </select>
                                            );
                                          }

                                          // Show "Dem" for demobilized
                                          if (
                                            dailyHour.jobStatus ===
                                            "demobilized"
                                          ) {
                                            return (
                                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                Dem
                                              </span>
                                            );
                                          }

                                          // For null status, show "-" as text (not input) to allow double-click
                                          if (dailyHour.jobStatus === null) {
                                            return (
                                              <div
                                                className="w-full px-0.5 py-0.5 text-xs text-center text-gray-400 dark:text-gray-600 font-medium cursor-pointer hover:text-brand-600 dark:hover:text-brand-400"
                                                title="Double-click to set status"
                                              >
                                                -
                                              </div>
                                            );
                                          }

                                          // Show status abbreviation if hours are 0, otherwise show hours
                                          const isAbbreviation =
                                            hoursValue === 0;

                                          // If showing abbreviation (0 hours), display as text unless editing
                                          if (
                                            isAbbreviation &&
                                            !isEditingHours
                                          ) {
                                            return (
                                              <div
                                                onClick={(e) => {
                                                  if (canEdit) {
                                                    e.stopPropagation();
                                                    setEditingHoursCell(
                                                      cellKey
                                                    );
                                                  }
                                                }}
                                                className={`w-full px-0.5 py-0.5 text-xs text-center font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${colorClass}`}
                                                title={`Status: ${statusValue} (Click to edit hours, Double-click to change status)`}
                                              >
                                                {getStatusAbbreviation(
                                                  statusValue
                                                )}
                                              </div>
                                            );
                                          }

                                          // Show normal hours input (or when editing 0 hours)
                                          return (
                                            <input
                                              type="number"
                                              min="0"
                                              max="24"
                                              step="1"
                                              value={hoursValue}
                                              autoFocus={isEditingHours}
                                              onChange={(e) =>
                                                handleHoursChange(
                                                  projectId,
                                                  employee.employeeId,
                                                  dailyHour.date,
                                                  Math.round(
                                                    Number(e.target.value)
                                                  ),
                                                  statusValue
                                                )
                                              }
                                              onBlur={() => {
                                                if (isEditingHours) {
                                                  setEditingHoursCell(null);
                                                }
                                              }}
                                              disabled={!canEdit}
                                              title={`Status: ${statusValue} (Double-click to change)`}
                                              className={`w-full px-0.5 py-0.5 text-xs text-center border border-gray-300 dark:border-gray-600 rounded
                                                     bg-white dark:bg-gray-700 font-medium
                                                     focus:ring-1 focus:ring-brand-500 focus:border-brand-500
                                                     disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                                                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                                                     ${colorClass}`}
                                            />
                                          );
                                        })()}
                                        {dailyHour &&
                                          (dailyHour as any).discrepancyWithMobilization && (
                                            <>
                                              <button
                                                type="button"
                                                data-discrepancy-trigger
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const key = `${projectId}-${employee.employeeId}-${dailyHour.date}`;
                                                  setDiscrepancyMenuCell((prev) =>
                                                    prev === key ? null : key
                                                  );
                                                }}
                                                className="absolute top-0 right-0.5 p-0.5 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
                                                title="Differs from mobilization – click to sync"
                                              >
                                                <AlertIcon className="w-3.5 h-3.5" />
                                              </button>
                                              {discrepancyMenuCell ===
                                                `${projectId}-${employee.employeeId}-${dailyHour.date}` && (
                                                <div
                                                  data-discrepancy-menu
                                                  className="absolute right-0 top-full mt-0.5 z-[100] min-w-[240px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg p-2 text-left text-xs"
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                >
                                                  <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Differs from mobilization
                                                  </p>
                                                  {(dailyHour as any)
                                                    .effectiveMobilizationSnapshot && (
                                                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                                                      Mobilization:{" "}
                                                      {(dailyHour as any)
                                                        .effectiveMobilizationSnapshot
                                                        .projectName || "Idle"}
                                                      ,{" "}
                                                      {(dailyHour as any)
                                                        .effectiveMobilizationSnapshot
                                                        .jobStatus}
                                                      {(dailyHour as any)
                                                        .effectiveMobilizationSnapshot
                                                        .tradeName &&
                                                        `, ${(dailyHour as any).effectiveMobilizationSnapshot.tradeName}`}
                                                    </p>
                                                  )}
                                                  <div className="flex flex-col gap-1">
                                                    <button
                                                      type="button"
                                                      disabled={
                                                        !dailyHour.entryId ||
                                                        removeEntryUseMobilizationMutation.isPending
                                                      }
                                                      onClick={() =>
                                                        dailyHour.entryId &&
                                                        removeEntryUseMobilizationMutation.mutate(
                                                          dailyHour.entryId
                                                        )
                                                      }
                                                      className="w-full px-2 py-1.5 text-left rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                                                    >
                                                      Sync timesheet with
                                                      mobilization
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={
                                                        !dailyHour.entryId ||
                                                        syncMobilizationFromEntryMutation.isPending
                                                      }
                                                      onClick={() =>
                                                        dailyHour.entryId &&
                                                        syncMobilizationFromEntryMutation.mutate(
                                                          dailyHour.entryId
                                                        )
                                                      }
                                                      className="w-full px-2 py-1.5 text-left rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                                                    >
                                                      Sync mobilization with
                                                      timesheet
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                  <td
                                    className="px-2 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50"
                                    style={{ minWidth: "70px", width: "70px" }}
                                  >
                                    {employeeTotal}
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Total Row */}
                            <tr className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                              <td
                                colSpan={4}
                                className="sticky left-0 z-10 px-2 py-3 text-right text-sm font-bold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900"
                                style={{ minWidth: "400px" }}
                              >
                                Total Hrs
                              </td>
                              {days.map((day) => {
                                // Calculate total for this day across displayed employees
                                const dayTotal = Math.round(
                                  employeesToShow.reduce(
                                    (sum: number, employee: any) => {
                                      const dailyHour =
                                        employee.dailyHours.find(
                                          (dh: any) => dh.day === day
                                        );
                                      if (
                                        dailyHour &&
                                        dailyHour.jobStatus &&
                                        dailyHour.jobStatus !== "demobilized" &&
                                        dailyHour.jobStatus !== null
                                      ) {
                                        return (
                                          sum +
                                          getHoursValue(
                                            projectId,
                                            employee.employeeId,
                                            dailyHour
                                          )
                                        );
                                      }
                                      return sum;
                                    },
                                    0
                                  )
                                );

                                return (
                                  <td
                                    key={day}
                                    className="px-0.5 py-3 text-center text-xs font-bold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700"
                                    style={{ minWidth: "45px", width: "45px" }}
                                  >
                                    {dayTotal > 0 ? dayTotal : "-"}
                                  </td>
                                );
                              })}
                              <td
                                className="px-2 py-3 text-center text-sm font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800"
                                style={{ minWidth: "70px", width: "70px" }}
                              >
                                {Math.round(
                                  employeesToShow.reduce(
                                    (grandTotal: number, employee: any) => {
                                      return (
                                        grandTotal +
                                        employee.dailyHours.reduce(
                                          (sum: number, dh: any) => {
                                            if (
                                              dh.jobStatus &&
                                              dh.jobStatus !== "demobilized" &&
                                              dh.jobStatus !== null
                                            ) {
                                              return (
                                                sum +
                                                getHoursValue(
                                                  projectId,
                                                  employee.employeeId,
                                                  dh
                                                )
                                              );
                                            }
                                            return sum;
                                          },
                                          0
                                        )
                                      );
                                    },
                                    0
                                  )
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {exportProjectId !== null &&
        (() => {
          const exportTimesheetData = timesheetsByProject.get(exportProjectId);
          if (!exportTimesheetData) return null;

          return (
            <TimesheetExportModal
              isOpen={true}
              onClose={() => setExportProjectId(null)}
              timesheetData={exportTimesheetData}
              month={selectedMonth}
              projectEdits={
                projectEdits[exportProjectId] || new Map<string, DayEdit>()
              }
              getHoursValue={(employeeId: number, dailyHour: any) => {
                const key = `${employeeId}-${dailyHour.date}`;
                const edits = projectEdits[exportProjectId];
                return edits?.has(key)
                  ? edits.get(key)!.hours
                  : dailyHour.hoursWorked;
              }}
              getStatusValue={(employeeId: number, dailyHour: any) => {
                const key = `${employeeId}-${dailyHour.date}`;
                const edits = projectEdits[exportProjectId];
                const editStatus = edits?.has(key)
                  ? edits.get(key)!.status
                  : undefined;
                return editStatus || dailyHour.jobStatus || "active";
              }}
            />
          );
        })()}

      {/* Unlock Confirmation Modal */}
      {unlockConfirmProjectId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <LockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Unlock Approved Timesheet
              </h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This is an approved timesheet. Are you sure you want to unlock it
              for editing? You will need to resubmit the timesheet after making
              changes.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setUnlockConfirmProjectId(null)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUnlockApproved(unlockConfirmProjectId)}
                variant="primary"
                size="sm"
              >
                Yes, Unlock
              </Button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
