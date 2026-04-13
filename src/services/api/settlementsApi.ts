import axiosInstance from "../../lib/axios";
import {
  Settlement,
  CreateSettlementRequest,
  UpdateSettlementRequest,
  SettlementListResponse,
} from "../../types/settlement";

export const settlementsApi = {
  // Get all settlements with pagination
  getSettlements: async (
    page: number = 1,
    limit: number = 10
  ): Promise<SettlementListResponse> => {
    const response = await axiosInstance.get<SettlementListResponse>(
      `/settlements?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get a specific settlement by ID
  getSettlement: async (id: number): Promise<Settlement> => {
    const response = await axiosInstance.get<Settlement>(`/settlements/${id}`);
    return response.data;
  },

  // Get settlements by employee ID
  getSettlementsByEmployee: async (
    employeeId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<SettlementListResponse> => {
    const response = await axiosInstance.get<SettlementListResponse>(
      `/settlements/employee/${employeeId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Create a new settlement
  createSettlement: async (
    data: CreateSettlementRequest
  ): Promise<Settlement> => {
    const response = await axiosInstance.post<Settlement>("/settlements", data);
    return response.data;
  },

  // Update a settlement
  updateSettlement: async (
    id: number,
    data: UpdateSettlementRequest
  ): Promise<Settlement> => {
    const response = await axiosInstance.put<Settlement>(
      `/settlements/${id}`,
      data
    );
    return response.data;
  },

  // Delete a settlement
  deleteSettlement: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/settlements/${id}`);
  },

  // Delete multiple settlements
  deleteMany: async (ids: number[]): Promise<{ deleted: number; skipped: number }> => {
    const response = await axiosInstance.post<{ deleted: number; skipped: number }>(
      "/settlements/actions/delete-many",
      { ids }
    );
    return response.data;
  },

  // Search settlements
  searchSettlements: async (
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<SettlementListResponse> => {
    const response = await axiosInstance.get<SettlementListResponse>(
      `/settlements/actions/search?q=${encodeURIComponent(
        query
      )}&page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Approve settlement
  approveSettlement: async (id: number): Promise<Settlement> => {
    const response = await axiosInstance.post<Settlement>(
      `/settlements/${id}/approve`
    );
    return response.data;
  },

  // Mark settlement as paid
  markAsPaid: async (id: number): Promise<Settlement> => {
    const response = await axiosInstance.post<Settlement>(
      `/settlements/${id}/mark-paid`
    );
    return response.data;
  },


  // Export settlement to Excel
  exportSettlementExcel: async (id: number): Promise<Blob> => {
    const response = await axiosInstance.get(
      `/settlements/${id}/excel`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  // Calculate gratuity for an employee
  calculateGratuity: async (
    employeeId: number,
    lastDateOfWork?: string
  ): Promise<{
    totalYearsOfService: number;
    gratuityAmount: number;
    eligibleDays: number;
    hourlyRate: number;
  }> => {
    const url = lastDateOfWork
      ? `/settlements/actions/calculate-gratuity/${employeeId}?lastDateOfWork=${lastDateOfWork}`
      : `/settlements/actions/calculate-gratuity/${employeeId}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },
};
