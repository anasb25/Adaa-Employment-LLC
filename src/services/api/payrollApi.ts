import { axiosInstance } from "../../lib/axios";
import {
  Payroll,
  CreatePayrollRequest,
  UpdatePayrollRequest,
  PayrollFilters,
} from "../../types/payroll";

export const payrollApi = {
  /**
   * Get all payrolls with filters
   */
  getPayrolls: async (filters?: PayrollFilters): Promise<any> => {
    const response = await axiosInstance.get("/payroll", { params: filters });
    return response.data;
  },

  /**
   * Get payrolls for a specific month
   */
  getPayrollsByMonth: async (month: string): Promise<Payroll[]> => {
    const response = await axiosInstance.get(`/payroll/month/${month}`);
    return response.data;
  },

  /**
   * Get a single payroll by ID
   */
  getPayroll: async (id: number): Promise<Payroll> => {
    const response = await axiosInstance.get(`/payroll/${id}`);
    return response.data;
  },

  /**
   * Create a new payroll entry
   */
  createPayroll: async (data: CreatePayrollRequest): Promise<Payroll> => {
    const response = await axiosInstance.post("/payroll", data);
    return response.data;
  },

  /**
   * Create or update payroll (upsert)
   */
  upsertPayroll: async (data: CreatePayrollRequest): Promise<Payroll> => {
    const response = await axiosInstance.post("/payroll/upsert", data);
    return response.data;
  },

  /**
   * Bulk create or update payrolls
   */
  bulkUpsertPayrolls: async (
    payrolls: CreatePayrollRequest[]
  ): Promise<Payroll[]> => {
    const response = await axiosInstance.post("/payroll/bulk", payrolls);
    return response.data;
  },

  /**
   * Update an existing payroll entry
   */
  updatePayroll: async (
    id: number,
    data: UpdatePayrollRequest
  ): Promise<Payroll> => {
    const response = await axiosInstance.put(`/payroll/${id}`, data);
    return response.data;
  },

  /**
   * Delete a payroll entry
   */
  deletePayroll: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/payroll/${id}`);
  },

  deleteMany: async (ids: number[]): Promise<{ deleted: number }> => {
    const response = await axiosInstance.post<{ deleted: number }>(
      "/payroll/actions/delete-many",
      { ids }
    );
    return response.data;
  },

  /**
   * Calculate payroll for a specific month from approved timesheets
   */
  calculatePayrollForMonth: async (month: string): Promise<Payroll[]> => {
    const response = await axiosInstance.post(
      `/payroll/calculate/month/${month}`
    );
    return response.data;
  },

  /**
   * Calculate payroll for a specific project and month
   */
  calculatePayrollForProject: async (
    projectId: number,
    month: string
  ): Promise<Payroll[]> => {
    const response = await axiosInstance.post(
      `/payroll/calculate/project/${projectId}/month/${month}`
    );
    return response.data;
  },

  /**
   * Import allowances and deductions from Excel file
   */
  importAllowancesDeductions: async (
    month: string,
    file: File
  ): Promise<{
    success: boolean;
    message: string;
    updated: number;
    notFound: string[];
    errors: string[];
  }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post(
      `/payroll/import-allowances-deductions/${month}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Download Excel template for allowances/deductions import
   */
  downloadAllowancesDeductionsTemplate: async (): Promise<Blob> => {
    const response = await axiosInstance.get(
      "/payroll/template/allowances-deductions",
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  /**
   * Download payroll PDF (server-generated, same approach as invoices)
   */
  downloadPayrollPdf: async (id: number): Promise<Blob> => {
    const response = await axiosInstance.get(`/payroll/${id}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Check if payroll exists for an employee and month
   */
  checkPayrollExists: async (
    employeeId: number,
    month: string
  ): Promise<{ exists: boolean; payroll: Payroll | null }> => {
    const response = await axiosInstance.get(
      `/payroll/check/${employeeId}/${month}`
    );
    return response.data;
  },
};
