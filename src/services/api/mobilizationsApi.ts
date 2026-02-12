import axiosInstance from "../../lib/axios";
import {
  Mobilization,
  CreateMobilizationRequest,
  BulkCreateMobilizationRequest,
  UpdateMobilizationRequest,
  MobilizationFilters,
  MobilizationStatistics,
} from "../../types/mobilization";

export interface ImportMobilizationResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    employee: string;
    errors: string[];
  }>;
  imported: any[];
}

export const mobilizationsApi = {
  // Get all mobilizations with pagination and filters
  getAll: async (
    params?: MobilizationFilters & { page?: number; limit?: number }
  ) => {
    const response = await axiosInstance.get("/mobilizations", { params });
    return response.data;
  },

  // Get a single mobilization by ID
  getById: async (id: number): Promise<Mobilization> => {
    const response = await axiosInstance.get(`/mobilizations/${id}`);
    return response.data;
  },

  // Get current status for all employees (most recent mobilization for each)
  getCurrentStatusForAllEmployees: async (): Promise<Mobilization[]> => {
    const response = await axiosInstance.get("/mobilizations/current-status");
    return response.data;
  },

  // Get effective status for all employees on a specific date (carry-forward logic)
  getEffectiveStatusForAllEmployeesOnDate: async (
    date: string,
    includeDemobilized: boolean = false
  ): Promise<Mobilization[]> => {
    const response = await axiosInstance.get(
      "/mobilizations/effective-status-on-date",
      {
        params: {
          date,
          includeDemobilized: includeDemobilized ? "true" : undefined,
        },
      }
    );
    return response.data;
  },

  // Get latest active mobilization for an employee
  getLatestForEmployee: async (
    employeeId: number
  ): Promise<Mobilization | null> => {
    const response = await axiosInstance.get(
      `/mobilizations/employee/${employeeId}/latest`
    );
    return response.data;
  },

  // Get employee's effective status on a specific date (carry-forward logic)
  getEffectiveStatusOnDate: async (
    employeeId: number,
    date: string
  ): Promise<Mobilization | null> => {
    const response = await axiosInstance.get(
      `/mobilizations/employee/${employeeId}/status-on-date`,
      {
        params: { date },
      }
    );
    return response.data;
  },

  // Get employee mobilization history within date range
  getEmployeeHistory: async (
    employeeId: number,
    startDate?: string,
    endDate?: string
  ): Promise<Mobilization[]> => {
    const response = await axiosInstance.get(
      `/mobilizations/employee/${employeeId}/history`,
      {
        params: { startDate, endDate },
      }
    );
    return response.data;
  },

  // Get all employees currently mobilized to a project
  getEmployeesOnProject: async (projectId: number): Promise<Mobilization[]> => {
    const response = await axiosInstance.get(
      `/mobilizations/project/${projectId}/employees`
    );
    return response.data;
  },

  // Create a single mobilization
  create: async (data: CreateMobilizationRequest): Promise<Mobilization> => {
    const response = await axiosInstance.post("/mobilizations", data);
    return response.data;
  },

  // Create bulk mobilizations
  createBulk: async (
    data: BulkCreateMobilizationRequest
  ): Promise<Mobilization[]> => {
    const response = await axiosInstance.post("/mobilizations/bulk", data);
    return response.data;
  },

  // Update a mobilization
  update: async (
    id: number,
    data: UpdateMobilizationRequest
  ): Promise<Mobilization> => {
    const response = await axiosInstance.patch(`/mobilizations/${id}`, data);
    return response.data;
  },

  // Delete a mobilization
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/mobilizations/${id}`);
  },

  // Get statistics
  getStatistics: async (
    projectId?: number
  ): Promise<MobilizationStatistics> => {
    const response = await axiosInstance.get("/mobilizations/statistics", {
      params: projectId ? { projectId } : {},
    });
    return response.data;
  },

  // Import mobilizations from Excel file
  importMobilizations: async (
    file: File
  ): Promise<ImportMobilizationResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post<ImportMobilizationResult>(
      "/mobilizations/actions/import",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Export all mobilizations to Excel
  exportMobilizations: async (): Promise<Blob> => {
    const response = await axiosInstance.get("/mobilizations/actions/export", {
      responseType: "blob",
    });
    return response.data;
  },

  // Download import template
  downloadImportTemplate: async (): Promise<Blob> => {
    const response = await axiosInstance.get(
      "/mobilizations/actions/import-template",
      {
        responseType: "blob",
      }
    );
    return response.data;
  },
};
