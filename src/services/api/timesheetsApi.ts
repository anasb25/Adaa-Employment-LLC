import { axiosInstance } from "../../lib/axios";
import {
  Timesheet,
  MonthlyProjectTimesheetData,
  CreateTimesheetRequest,
  SaveTimesheetEntriesRequest,
  SubmitTimesheetRequest,
  ApproveTimesheetRequest,
  TimesheetFilters,
  DailyUtilizationReport,
} from "../../types/timesheet";

export const timesheetsApi = {
  /**
   * Get daily utilization report
   * @param date Format: YYYY-MM-DD
   */
  getDailyUtilizationReport: async (
    date: string,
  ): Promise<DailyUtilizationReport> => {
    const response = await axiosInstance.get("/timesheets/daily-utilization", {
      params: { date },
    });
    return response.data;
  },

  /**
   * Get monthly project timesheet with data
   * @param projectId Project ID
   * @param month Format: YYYY-MM
   */
  getMonthlyProjectTimesheet: async (
    projectId: number,
    month: string,
  ): Promise<MonthlyProjectTimesheetData> => {
    const response = await axiosInstance.get(
      `/timesheets/project/${projectId}/month/${month}`,
    );
    return response.data;
  },

  /**
   * Create or get timesheet
   */
  createOrGetTimesheet: async (
    data: CreateTimesheetRequest,
  ): Promise<Timesheet> => {
    const response = await axiosInstance.post("/timesheets", data);
    return response.data;
  },

  /**
   * Save timesheet entries
   */
  saveTimesheetEntries: async (
    timesheetId: number,
    data: SaveTimesheetEntriesRequest,
  ): Promise<any> => {
    const response = await axiosInstance.put(
      `/timesheets/${timesheetId}/entries`,
      data,
    );
    return response.data;
  },

  /**
   * Submit timesheet for approval
   */
  submitTimesheet: async (
    timesheetId: number,
    data: SubmitTimesheetRequest,
  ): Promise<Timesheet> => {
    const response = await axiosInstance.post(
      `/timesheets/${timesheetId}/submit`,
      data,
    );
    return response.data;
  },

  /**
   * Approve or reject timesheet
   */
  approveTimesheet: async (
    timesheetId: number,
    data: ApproveTimesheetRequest,
  ): Promise<Timesheet> => {
    const response = await axiosInstance.post(
      `/timesheets/${timesheetId}/approve`,
      data,
    );
    return response.data;
  },

  /**
   * Get all timesheets with filters
   */
  getTimesheets: async (filters?: TimesheetFilters): Promise<Timesheet[]> => {
    const response = await axiosInstance.get("/timesheets", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get a single timesheet by ID
   */
  getTimesheet: async (id: number): Promise<Timesheet> => {
    const response = await axiosInstance.get(`/timesheets/${id}`);
    return response.data;
  },

  /**
   * Delete a timesheet
   */
  deleteTimesheet: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/timesheets/${id}`);
  },
};
