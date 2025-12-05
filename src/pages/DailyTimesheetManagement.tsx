import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { timesheetsApi } from "../services/api/timesheetsApi";
import { projectsApi } from "../services/api/projectsApi";
import { skillsApi } from "../services/api/skillsApi";
import { allocationsApi } from "../services/api/allocationsApi";
import { QUERY_KEYS } from "../lib/constants";
import {
  UpdateTimesheetRequest,
  AttendanceStatus,
} from "../types/timesheet";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Badge from "../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";

// Helper function to get default hours based on status
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

export default function DailyTimesheetManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Select Date (default to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Project filter (optional)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Track if timesheets were just generated
  const [justGenerated, setJustGenerated] = useState<{
    date: string;
    created: number;
    existing: number;
  } | null>(null);

  // Fetch data
  const { data: projectsData } = useQuery({
    queryKey: QUERY_KEYS.projects.all,
    queryFn: () => projectsApi.getProjects(),
  });

  const { data: skillsData } = useQuery({
    queryKey: QUERY_KEYS.skills.all,
    queryFn: () => skillsApi.getSkills(),
  });

  // Fetch timesheets for selected date
  const {
    data: timesheetsData,
    isLoading: timesheetsLoading,
    refetch,
  } = useQuery({
    queryKey: [...QUERY_KEYS.timesheets.all, selectedDate],
    queryFn: () =>
      timesheetsApi.getTimesheets({
        startDate: selectedDate,
        endDate: selectedDate,
      }),
    enabled: !!selectedDate,
  });

  // Generate timesheets mutation
  const generateMutation = useMutation({
    mutationFn: (date: string) => timesheetsApi.generateDailyTimesheets(date),
    onSuccess: (data) => {
      toast.success(data.message);
      setJustGenerated({
        date: selectedDate,
        created: data.created,
        existing: data.existing,
      });
      // Don't refetch immediately - show success message first
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to generate timesheets"
      );
    },
  });

  // Update timesheet mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTimesheetRequest }) =>
      timesheetsApi.updateTimesheet(id, data),
    onSuccess: () => {
      toast.success("Timesheet updated!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update timesheet"
      );
    },
  });

  // Unallocate mutation
  const unallocateMutation = useMutation({
    mutationFn: (allocationId: number) =>
      allocationsApi.deleteAllocation(allocationId),
    onSuccess: () => {
      toast.success("Employee unallocated successfully!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.allocations.all,
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to unallocate employee"
      );
    },
  });

  // Filter timesheets
  const filteredTimesheets = useMemo(() => {
    if (!timesheetsData?.data) return [];

    if (selectedProjectId) {
      return timesheetsData.data.filter(
        (ts: any) =>
          ts.allocation?.project?.id === parseInt(selectedProjectId)
      );
    }

    return timesheetsData.data;
  }, [timesheetsData?.data, selectedProjectId]);

  // Group by project, then by trade
  const { projectGroups, idleEmployees } = useMemo(() => {
    const groups: Record<
      string,
      { project: any; byTrade: Record<string, any[]> }
    > = {};
    const idle: any[] = [];

    filteredTimesheets.forEach((ts: any) => {
      if (!ts.allocation || !ts.allocation.project) {
        idle.push(ts);
        return;
      }

      const projectId = ts.allocation.project.id;
      const tradeName = ts.tradeInSite?.skill || "Unassigned";

      if (!groups[projectId]) {
        groups[projectId] = {
          project: ts.allocation.project,
          byTrade: {},
        };
      }

      if (!groups[projectId].byTrade[tradeName]) {
        groups[projectId].byTrade[tradeName] = [];
      }

      groups[projectId].byTrade[tradeName].push(ts);
    });

    return { projectGroups: groups, idleEmployees: idle };
  }, [filteredTimesheets]);

  // Format date for display
  const formattedDate = useMemo(() => {
    if (!selectedDate) return "";
    const date = new Date(selectedDate + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  // Handle generate timesheets
  const handleGenerate = () => {
    if (
      window.confirm(
        `Generate timesheets for all employees on ${formattedDate}? This will create IDLE timesheets for any employees that don't have one yet.`
      )
    ) {
      generateMutation.mutate(selectedDate);
    }
  };

  // Update a timesheet field
  const updateTimesheet = (
    id: number,
    field: keyof UpdateTimesheetRequest,
    value: any
  ) => {
    const updates: UpdateTimesheetRequest = { [field]: value };

    // Auto-adjust hours when status changes
    if (field === "status") {
      updates.hoursWorked = getDefaultHours(value as AttendanceStatus);

      // If changing to IDLE, remove allocation
      if (value === AttendanceStatus.IDLE) {
        const ts = filteredTimesheets.find((t: any) => t.id === id);
        if (ts?.allocation?.id) {
          if (
            window.confirm(
              "Setting status to IDLE will unallocate this employee from the project. Continue?"
            )
          ) {
            updates.allocationId = null;
            updates.tradeInSiteId = null;
          } else {
            return; // Cancel the update
          }
        }
      }
    }

    updateMutation.mutate({ id, data: updates });
  };

  // Handle unallocate
  const handleUnallocate = (timesheetId: number, allocationId: number) => {
    if (
      window.confirm(
        "Are you sure you want to unallocate this employee from the project?"
      )
    ) {
      // First unallocate
      unallocateMutation.mutate(allocationId);
      
      // Then update timesheet to IDLE
      updateMutation.mutate({
        id: timesheetId,
        data: {
          allocationId: null,
          status: AttendanceStatus.IDLE,
          hoursWorked: 8,
          tradeInSiteId: null,
        },
      });
    }
  };

  const noTimesheets =
    !timesheetsLoading && (!timesheetsData?.data || timesheetsData.data.length === 0);

  return (
    <>
      <PageMeta
        title="Daily Timesheet Management | ADAA Employment LLC"
        description="Manage daily employee timesheets and attendance"
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
        <PageBreadcrumb pageTitle="Daily Timesheets" />

        <div className="space-y-6">
          {/* Date Selection & Actions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Daily Timesheet Management
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View and manage employee timesheets for a specific date
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>
                  Select Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    // Clear justGenerated when date changes
                    setJustGenerated(null);
                  }}
                />
              </div>

              <div>
                <Label>Filter by Project (Optional)</Label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="">All Projects</option>
                  {projectsData?.data?.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !selectedDate}
                  className="w-full"
                >
                  {generateMutation.isPending
                    ? "Generating..."
                    : "Generate Timesheets for This Date"}
                </Button>
              </div>
            </div>

            {formattedDate && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Viewing:</strong> {formattedDate}
                </p>
              </div>
            )}
          </div>

          {timesheetsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Success message after generation - shows in place of table */}
          {!timesheetsLoading && justGenerated && justGenerated.date === selectedDate && justGenerated.created > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
                  Timesheets Successfully Created!
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-1">
                  Successfully created timesheets for <strong>{formattedDate}</strong>
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {justGenerated.created} new timesheet{justGenerated.created !== 1 ? 's' : ''} created with status <strong>Idle</strong>
                  {justGenerated.existing > 0 && (
                    <span> • {justGenerated.existing} already existed</span>
                  )}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setJustGenerated(null);
                    refetch();
                  }}
                  variant="primary"
                >
                  View Timesheets
                </Button>
                <Button
                  onClick={() => setJustGenerated(null)}
                  variant="outline"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {noTimesheets && !justGenerated && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 dark:border-gray-800 dark:bg-white/[0.03] text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No timesheets found for {formattedDate}.
              </p>
              <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                Generate Timesheets for This Date
              </Button>
            </div>
          )}

          {/* Table only shows when NOT just generated */}
          {!timesheetsLoading && 
           !(justGenerated && justGenerated.date === selectedDate && justGenerated.created > 0) &&
           timesheetsData?.data && 
           timesheetsData.data.length > 0 && (
            <div className="space-y-8">
              {/* Project Timesheets */}
              {Object.entries(projectGroups).map(([projectId, group]) => (
                <div
                  key={projectId}
                  className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
                >
                  {/* Project Header */}
                  <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {group.project.name}
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formattedDate}
                        </p>
                      </div>
                      <Badge color="light" size="sm">
                        {Object.values(group.byTrade).reduce(
                          (sum, arr) => sum + arr.length,
                          0
                        )}{" "}
                        employee(s)
                      </Badge>
                    </div>
                  </div>

                  {/* Group by Trade */}
                  <div className="space-y-6">
                    {Object.entries(group.byTrade)
                      .sort((a, b) => {
                        if (a[0] === "Unassigned") return 1;
                        if (b[0] === "Unassigned") return -1;
                        return a[0].localeCompare(b[0]);
                      })
                      .map(([tradeName, timesheets]) => (
                        <div key={tradeName}>
                          <div className="mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              {tradeName}
                              <Badge color="light" size="sm">
                                {timesheets.length}
                              </Badge>
                            </h3>
                          </div>

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
                                {timesheets.map((ts: any) => {
                                  const empData =
                                    ts.employee || ts.allocation?.employee;
                                  return (
                                    <TableRow key={ts.id}>
                                      <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90 text-start">
                                        {empData?.name || "—"}
                                        <br />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {empData?.adaa_emp_code || ""}
                                        </span>
                                      </TableCell>
                                      <TableCell className="px-5 py-4 text-start">
                                        <select
                                          value={ts.tradeInSiteId || ""}
                                          onChange={(e) =>
                                            updateTimesheet(
                                              ts.id,
                                              "tradeInSiteId",
                                              parseInt(e.target.value) || null
                                            )
                                          }
                                          className="min-w-[150px] h-11 appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                        >
                                          <option value="">Select skill</option>
                                          {skillsData?.data?.map((skill: any) => (
                                            <option key={skill.id} value={skill.id}>
                                              {skill.skill}
                                            </option>
                                          ))}
                                        </select>
                                      </TableCell>
                                      <TableCell className="px-5 py-4 text-start">
                                        <Input
                                          type="number"
                                          min="0"
                                          step={1}
                                          value={ts.hoursWorked}
                                          onChange={(e) =>
                                            updateTimesheet(
                                              ts.id,
                                              "hoursWorked",
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          onBlur={(e) =>
                                            updateTimesheet(
                                              ts.id,
                                              "hoursWorked",
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          className="w-24"
                                        />
                                      </TableCell>
                                      <TableCell className="px-5 py-4 text-start">
                                        <select
                                          value={ts.status}
                                          onChange={(e) =>
                                            updateTimesheet(
                                              ts.id,
                                              "status",
                                              e.target.value as AttendanceStatus
                                            )
                                          }
                                          className="min-w-[120px] h-11 appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                        >
                                          <option value={AttendanceStatus.ACTIVE}>
                                            Active
                                          </option>
                                          <option value={AttendanceStatus.ON_HOLD}>
                                            On Hold
                                          </option>
                                          <option value={AttendanceStatus.IDLE}>
                                            Idle
                                          </option>
                                        </select>
                                      </TableCell>
                                      <TableCell className="px-5 py-4 text-start">
                                        <Input
                                          type="text"
                                          value={ts.notes || ""}
                                          onChange={(e) =>
                                            updateTimesheet(
                                              ts.id,
                                              "notes",
                                              e.target.value
                                            )
                                          }
                                          onBlur={(e) =>
                                            updateTimesheet(
                                              ts.id,
                                              "notes",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Notes"
                                          className="min-w-[150px]"
                                        />
                                      </TableCell>
                                      <TableCell className="px-5 py-4 text-start">
                                        {ts.allocation?.id && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                            onClick={() =>
                                              handleUnallocate(ts.id, ts.allocation.id)
                                            }
                                          >
                                            Unallocate
                                          </Button>
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
              ))}

              {/* Idle Employees Section */}
              {idleEmployees.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                  <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Idle Employees
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formattedDate}
                        </p>
                      </div>
                      <Badge color="light" size="sm">
                        {idleEmployees.length} employee(s)
                      </Badge>
                    </div>
                  </div>

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
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {idleEmployees.map((ts: any) => {
                          const empData = ts.employee || ts.allocation?.employee;
                          return (
                            <TableRow key={ts.id}>
                              <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90 text-start">
                                {empData?.name || "—"}
                                <br />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {empData?.adaa_emp_code || ""}
                                </span>
                              </TableCell>
                              <TableCell className="px-5 py-4 text-start">
                                <Input
                                  type="number"
                                  min="0"
                                  step={1}
                                  value={ts.hoursWorked}
                                  onBlur={(e) =>
                                    updateTimesheet(
                                      ts.id,
                                      "hoursWorked",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell className="px-5 py-4 text-start">
                                <Badge color="light" size="sm">
                                  Idle
                                </Badge>
                              </TableCell>
                              <TableCell className="px-5 py-4 text-start">
                                <Input
                                  type="text"
                                  value={ts.notes || ""}
                                  onBlur={(e) =>
                                    updateTimesheet(ts.id, "notes", e.target.value)
                                  }
                                  placeholder="Notes"
                                  className="min-w-[150px]"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </PermissionGuard>
    </>
  );
}

