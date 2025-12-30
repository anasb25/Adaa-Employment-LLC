import { axiosInstance } from '../../lib/axios';
import {
  Payroll,
  CreatePayrollRequest,
  UpdatePayrollRequest,
  PayrollFilters,
} from '../../types/payroll';

export const payrollApi = {
  /**
   * Get all payrolls with filters
   */
  getPayrolls: async (filters?: PayrollFilters): Promise<any> => {
    const response = await axiosInstance.get('/payroll', { params: filters });
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
    const response = await axiosInstance.post('/payroll', data);
    return response.data;
  },

  /**
   * Create or update payroll (upsert)
   */
  upsertPayroll: async (data: CreatePayrollRequest): Promise<Payroll> => {
    const response = await axiosInstance.post('/payroll/upsert', data);
    return response.data;
  },

  /**
   * Bulk create or update payrolls
   */
  bulkUpsertPayrolls: async (payrolls: CreatePayrollRequest[]): Promise<Payroll[]> => {
    const response = await axiosInstance.post('/payroll/bulk', payrolls);
    return response.data;
  },

  /**
   * Update an existing payroll entry
   */
  updatePayroll: async (id: number, data: UpdatePayrollRequest): Promise<Payroll> => {
    const response = await axiosInstance.put(`/payroll/${id}`, data);
    return response.data;
  },

  /**
   * Delete a payroll entry
   */
  deletePayroll: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/payroll/${id}`);
  },

  /**
   * Calculate payroll for a specific month from approved timesheets
   */
  calculatePayrollForMonth: async (month: string): Promise<Payroll[]> => {
    const response = await axiosInstance.post(`/payroll/calculate/month/${month}`);
    return response.data;
  },

  /**
   * Calculate payroll for a specific project and month
   */
  calculatePayrollForProject: async (
    projectId: number,
    month: string,
  ): Promise<Payroll[]> => {
    const response = await axiosInstance.post(
      `/payroll/calculate/project/${projectId}/month/${month}`,
    );
    return response.data;
  },
};

