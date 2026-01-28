import axiosInstance from "../../lib/axios";
import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "../../types/employee";
import { PaginatedResponse } from "./types";

export interface EmployeeListResponse {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    employee: string;
    errors: string[];
  }>;
  imported: any[];
}

export const employeesApi = {
  // Get all employees with pagination
  getEmployees: async (
    page: number = 1,
    limit: number = 10
  ): Promise<EmployeeListResponse> => {
    const response = await axiosInstance.get<EmployeeListResponse>(
      `/employees?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get a specific employee by ID
  getEmployee: async (id: number): Promise<Employee> => {
    const response = await axiosInstance.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  // Create a new employee
  createEmployee: async (data: CreateEmployeeRequest): Promise<Employee> => {
    const response = await axiosInstance.post<Employee>("/employees", data);
    return response.data;
  },

  // Update an employee
  updateEmployee: async (
    id: number,
    data: UpdateEmployeeRequest
  ): Promise<Employee> => {
    const response = await axiosInstance.put<Employee>(
      `/employees/${id}`,
      data
    );
    return response.data;
  },

  // Delete an employee
  deleteEmployee: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/employees/${id}`);
  },

  // Search employees by various fields
  searchEmployees: async (
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<EmployeeListResponse> => {
    const response = await axiosInstance.get<EmployeeListResponse>(
      `/employees/actions/search?q=${encodeURIComponent(
        query
      )}&page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get employees with their timesheet status for a specific date
  getEmployeesWithTimesheetStatus: async (
    date: string,
    status?: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<Employee>> => {
    const params = new URLSearchParams();
    params.append("date", date);
    if (status) params.append("status", status);
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));

    const res = await axiosInstance.get<PaginatedResponse<Employee>>(
      `/employees/actions/with-timesheet-status?${params.toString()}`
    );
    return res.data;
  },

  // Import employees from Excel file
  importEmployees: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post<ImportResult>(
      "/employees/actions/import",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Export all employees to Excel
  exportEmployees: async (): Promise<Blob> => {
    const response = await axiosInstance.get("/employees/actions/export", {
      responseType: "blob",
    });
    return response.data;
  },

  // Download import template
  downloadImportTemplate: async (): Promise<Blob> => {
    const response = await axiosInstance.get(
      "/employees/actions/import-template",
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  // Decrement air ticket count
  decrementAirTicket: async (id: number): Promise<Employee> => {
    const response = await axiosInstance.post<Employee>(
      `/employees/${id}/actions/decrement-air-ticket`
    );
    return response.data;
  },
};
