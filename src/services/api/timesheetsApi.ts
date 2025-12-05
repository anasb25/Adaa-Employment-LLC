import axiosInstance from "../../lib/axios";
import { PaginatedResponse } from "./types";
import {
  Timesheet,
  CreateTimesheetRequest,
  BulkCreateTimesheetRequest,
  UpdateTimesheetRequest,
  TimesheetFilters,
  TimesheetStats,
} from "../../types/timesheet";

export const timesheetsApi = {
  /**
   * Generate daily timesheets for all employees
   */
  generateDailyTimesheets: async (
    date: string
  ): Promise<{ created: number; existing: number; message: string }> => {
    const response = await axiosInstance.post("/timesheets/generate-daily", {
      date,
    });
    return response.data;
  },

  /**
   * Get all timesheets with optional filters
   */
  getTimesheets: async (
    filters?: TimesheetFilters
  ): Promise<PaginatedResponse<Timesheet>> => {
    const params = new URLSearchParams();
    if (filters?.projectId)
      params.append("projectId", filters.projectId.toString());
    if (filters?.employeeId)
      params.append("employeeId", filters.employeeId.toString());
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.status) params.append("status", filters.status);

    const queryString = params.toString();
    const url = queryString ? `/timesheets?${queryString}` : "/timesheets";

    const res = await axiosInstance.get<PaginatedResponse<Timesheet>>(url);
    return res.data;
  },

  /**
   * Get a single timesheet by ID
   */
  getTimesheet: async (id: number): Promise<Timesheet> => {
    const res = await axiosInstance.get<Timesheet>(`/timesheets/${id}`);
    return res.data;
  },

  /**
   * Get timesheets for a specific allocation
   */
  getTimesheetsByAllocation: async (
    allocationId: number
  ): Promise<Timesheet[]> => {
    const res = await axiosInstance.get<Timesheet[]>(
      `/timesheets/allocation/${allocationId}`
    );
    return res.data;
  },

  /**
   * Get timesheets for a specific date
   */
  getTimesheetsByDate: async (date: string): Promise<Timesheet[]> => {
    const res = await axiosInstance.get<Timesheet[]>(
      `/timesheets/by-date/${date}`
    );
    return res.data;
  },

  /**
   * Get timesheet statistics
   */
  getTimesheetStats: async (
    filters?: TimesheetFilters
  ): Promise<TimesheetStats> => {
    const params = new URLSearchParams();
    if (filters?.projectId)
      params.append("projectId", filters.projectId.toString());
    if (filters?.employeeId)
      params.append("employeeId", filters.employeeId.toString());
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const queryString = params.toString();
    const url = queryString
      ? `/timesheets/stats?${queryString}`
      : "/timesheets/stats";

    const res = await axiosInstance.get<TimesheetStats>(url);
    return res.data;
  },

  /**
   * Create a single timesheet entry
   */
  createTimesheet: async (data: CreateTimesheetRequest): Promise<Timesheet> => {
    const res = await axiosInstance.post<Timesheet>("/timesheets", data);
    return res.data;
  },

  /**
   * Create multiple timesheet entries at once (bulk EOD entry)
   */
  bulkCreateTimesheets: async (
    data: BulkCreateTimesheetRequest
  ): Promise<Timesheet[]> => {
    const res = await axiosInstance.post<Timesheet[]>("/timesheets/bulk", data);
    return res.data;
  },

  /**
   * Update a timesheet entry
   */
  updateTimesheet: async (
    id: number,
    data: UpdateTimesheetRequest
  ): Promise<Timesheet> => {
    const res = await axiosInstance.patch<Timesheet>(`/timesheets/${id}`, data);
    return res.data;
  },

  /**
   * Delete a timesheet entry
   */
  deleteTimesheet: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/timesheets/${id}`);
  },

  /**
   * Get dashboard analytics
   */
  getDashboardAnalytics: async (filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const queryString = params.toString();
    const url = queryString
      ? `/timesheets/dashboard/analytics?${queryString}`
      : "/timesheets/dashboard/analytics";

    const res = await axiosInstance.get(url);
    return res.data;
  },
};
