import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { timesheetsApi } from "../services/api/timesheetsApi";
import { projectsApi } from "../services/api/projectsApi";
import { QUERY_KEYS } from "../lib/constants";
import { TimesheetStatus, DailyHours } from "../types/timesheet";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import Label from "../components/form/Label";
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, PaperPlaneIcon, CheckLineIcon, CloseIcon } from "../icons";

interface ProjectEdits {
  [projectId: number]: Map<string, number>;
}

export default function MonthlyProjectTimesheets() {
  const queryClient = useQueryClient();
  
  // Get current month as default
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [projectEdits, setProjectEdits] = useState<ProjectEdits>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Set<number>>(new Set());

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: QUERY_KEYS.projects.all,
    queryFn: () => projectsApi.getProjects(),
  });

  // Fetch timesheet data for all projects
  const projectIds = projectsData?.data?.map((p: any) => p.id) || [];
  
  const timesheetQueries = projectIds.map((projectId: number) => 
    useQuery({
      queryKey: [...QUERY_KEYS.timesheets.all, 'project', projectId, selectedMonth],
      queryFn: () => timesheetsApi.getMonthlyProjectTimesheet(projectId, selectedMonth),
      enabled: !!projectId && !!selectedMonth,
    })
  );

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
      setHasUnsavedChanges(prev => {
        const newSet = new Set(prev);
        // Find project ID from timesheet
        timesheetQueries.forEach((query, idx) => {
          if (query.data?.timesheet?.id === variables.timesheetId) {
            newSet.delete(projectIds[idx]);
          }
        });
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
      toast.error(error.response?.data?.message || "Failed to submit timesheet");
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
      toast.error(error.response?.data?.message || "Failed to update timesheet");
    },
  });

  const getDaysInMonth = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
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

  const handleHoursChange = (projectId: number, employeeId: number, date: string, hours: number) => {
    const key = `${employeeId}-${date}`;
    
    setProjectEdits(prev => ({
      ...prev,
      [projectId]: new Map(prev[projectId] || new Map()).set(key, hours),
    }));
    
    setHasUnsavedChanges(prev => new Set(prev).add(projectId));
  };

  const getHoursValue = (projectId: number, employeeId: number, dailyHours: DailyHours): number => {
    const key = `${employeeId}-${dailyHours.date}`;
    const edits = projectEdits[projectId];
    return edits?.has(key) ? edits.get(key)! : dailyHours.hoursWorked;
  };

  const handleSave = async (projectId: number, timesheetData: any) => {
    if (!timesheetData) return;

    try {
      // Create timesheet if it doesn't exist
      let timesheetId = timesheetData.timesheet?.id;
      if (!timesheetId) {
        const newTimesheet = await createTimesheetMutation.mutateAsync({
          projectId,
          month: selectedMonth,
        });
        timesheetId = newTimesheet.id;
      }

      // Prepare entries
      const entries: any[] = [];
      const edits = projectEdits[projectId] || new Map();
      
      timesheetData.employees.forEach((employee: any) => {
        employee.dailyHours.forEach((dailyHour: any) => {
          if (dailyHour.jobStatus && dailyHour.jobStatus !== 'demobilized') {
            const key = `${employee.employeeId}-${dailyHour.date}`;
            const hours = edits.has(key) ? edits.get(key)! : dailyHour.hoursWorked;
            
            entries.push({
              employeeId: employee.employeeId,
              date: dailyHour.date,
              hoursWorked: hours,
              jobStatus: dailyHour.jobStatus,
              notes: dailyHour.notes,
            });
          }
        });
      });

      await saveEntriesMutation.mutateAsync({ timesheetId, entries });
      
      // Clear edits for this project
      setProjectEdits(prev => {
        const newEdits = { ...prev };
        delete newEdits[projectId];
        return newEdits;
      });
    } catch (error) {
      console.error('Error saving timesheet:', error);
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
          projectId,
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
            if (dailyHour.jobStatus && dailyHour.jobStatus !== 'demobilized') {
              const key = `${employee.employeeId}-${dailyHour.date}`;
              const hours = edits.has(key) ? edits.get(key)! : dailyHour.hoursWorked;
              
              entries.push({
                employeeId: employee.employeeId,
                date: dailyHour.date,
                hoursWorked: hours,
                jobStatus: dailyHour.jobStatus,
                notes: dailyHour.notes,
              });
            }
          });
        });

        await saveEntriesMutation.mutateAsync({ timesheetId, entries });
        
        // Clear edits for this project
        setProjectEdits(prev => {
          const newEdits = { ...prev };
          delete newEdits[projectId];
          return newEdits;
        });
      }

      // Submit the timesheet
      await submitTimesheetMutation.mutateAsync({ timesheetId });
    } catch (error) {
      console.error('Error submitting timesheet:', error);
    }
  };

  const handleApprove = async (timesheetId: number, status: TimesheetStatus.APPROVED | TimesheetStatus.REJECTED) => {
    await approveTimesheetMutation.mutateAsync({ timesheetId, status });
  };

  const getStatusBadgeColor = (status: TimesheetStatus) => {
    switch (status) {
      case TimesheetStatus.DRAFT:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case TimesheetStatus.SUBMITTED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case TimesheetStatus.APPROVED:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case TimesheetStatus.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isLoading = timesheetQueries.some(q => q.isLoading);

  return (
    <PermissionGuard requiredPermissions={["view_timesheets"]}>
      <PageMeta title="Monthly Project Timesheets" />
      
      <div className="space-y-6">
        <PageBreadcrumb
          items={[
            { label: "Timesheets", href: "/timesheets" },
            { label: "Monthly View", href: "/timesheets/monthly" },
          ]}
        />

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
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading timesheets...</span>
            </div>
          </div>
        )}

        {/* Project Accordions */}
        {!isLoading && (
          <div className="space-y-4">
            {timesheetQueries.map((query, index) => {
              const projectId = projectIds[index];
              const timesheetData = query.data;
              
              if (!timesheetData || timesheetData.employees.length === 0) return null;

              const isExpanded = expandedProjects.has(projectId);
              const hasChanges = hasUnsavedChanges.has(projectId);
              const status = timesheetData.timesheet?.status || TimesheetStatus.DRAFT;
              const isSubmitted = status === TimesheetStatus.SUBMITTED;
              const canEdit = status !== TimesheetStatus.SUBMITTED;

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
                          {timesheetData.project.client.name} • {timesheetData.employees.length} employees
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <Badge className={getStatusBadgeColor(status)}>
                        {status.toUpperCase()}
                      </Badge>
                      {hasChanges && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Unsaved
                        </Badge>
                      )}
                    </div>
                  </button>

                  {/* Project Timesheet Table */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {/* Action Buttons */}
                      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                        {canEdit && (
                          <>
                            <Button
                              onClick={() => handleSave(projectId, timesheetData)}
                              disabled={!hasChanges || saveEntriesMutation.isPending}
                              size="sm"
                              startIcon={<CheckCircleIcon />}
                            >
                              {saveEntriesMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              onClick={() => handleSubmit(projectId, timesheetData)}
                              variant="primary"
                              size="sm"
                              disabled={submitTimesheetMutation.isPending}
                              startIcon={<PaperPlaneIcon />}
                            >
                              {submitTimesheetMutation.isPending ? "Submitting..." : "Submit"}
                            </Button>
                          </>
                        )}
                        {isSubmitted && (
                          <>
                            <Button
                              onClick={() => handleApprove(timesheetData.timesheet!.id, TimesheetStatus.REJECTED)}
                              variant="outline"
                              size="sm"
                              disabled={approveTimesheetMutation.isPending}
                              startIcon={<CloseIcon />}
                            >
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleApprove(timesheetData.timesheet!.id, TimesheetStatus.APPROVED)}
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

                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                          <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                              <th 
                                className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-900/50 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-700"
                                style={{ minWidth: '40px', width: '40px' }}
                              >
                                Sr
                              </th>
                              <th 
                                className="sticky left-[40px] z-20 bg-gray-50 dark:bg-gray-900/50 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-700"
                                style={{ minWidth: '90px', width: '90px' }}
                              >
                                ID No
                              </th>
                              <th 
                                className="sticky left-[130px] z-20 bg-gray-50 dark:bg-gray-900/50 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-700"
                                style={{ minWidth: '150px', width: '150px' }}
                              >
                                Name
                              </th>
                              <th 
                                className="sticky left-[280px] z-20 bg-gray-50 dark:bg-gray-900/50 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-700"
                                style={{ minWidth: '120px', width: '120px' }}
                              >
                                Trade
                              </th>
                              {days.map((day) => (
                                <th
                                  key={day}
                                  className="px-0.5 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-r border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                                  style={{ minWidth: '45px', width: '45px' }}
                                >
                                  {day}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800">
                            {timesheetData.employees.map((employee: any) => (
                              <tr key={employee.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
                                <td 
                                  className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 whitespace-nowrap"
                                  style={{ minWidth: '40px', width: '40px' }}
                                >
                                  {employee.srNo}
                                </td>
                                <td 
                                  className="sticky left-[40px] z-10 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 whitespace-nowrap"
                                  style={{ minWidth: '90px', width: '90px' }}
                                >
                                  {employee.idNo}
                                </td>
                                <td 
                                  className="sticky left-[130px] z-10 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700"
                                  style={{ minWidth: '150px', width: '150px' }}
                                >
                                  <div className="truncate" title={employee.name}>
                                    {employee.name}
                                  </div>
                                </td>
                                <td 
                                  className="sticky left-[280px] z-10 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700"
                                  style={{ minWidth: '120px', width: '120px' }}
                                >
                                  <div className="truncate" title={employee.trade}>
                                    {employee.trade}
                                  </div>
                                </td>
                                {employee.dailyHours.map((dailyHour: any) => (
                                  <td
                                    key={dailyHour.day}
                                    className="px-0.5 py-1 text-center border-r border-gray-200 dark:border-gray-700"
                                    style={{ minWidth: '45px', width: '45px' }}
                                  >
                                    {dailyHour.jobStatus === 'demobilized' ? (
                                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Dem</span>
                                    ) : dailyHour.jobStatus === null ? (
                                      <span className="text-xs text-gray-400 dark:text-gray-600">-</span>
                                    ) : (
                                      <input
                                        type="number"
                                        min="0"
                                        max="24"
                                        step="0.5"
                                        value={getHoursValue(projectId, employee.employeeId, dailyHour)}
                                        onChange={(e) => handleHoursChange(projectId, employee.employeeId, dailyHour.date, Number(e.target.value))}
                                        disabled={!canEdit}
                                        className="w-full px-0.5 py-0.5 text-xs text-center border border-gray-300 dark:border-gray-600 rounded
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                                 focus:ring-1 focus:ring-brand-500 focus:border-brand-500
                                                 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                                                 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
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
    </PermissionGuard>
  );
}
