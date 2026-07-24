import axiosInstance from "../../lib/axios";
import { DashboardStats, EmployeeWithExpiringDocs } from "../../types/dashboard";
import { API_BASE_URL } from "../../lib/constants";

export const dashboardApi = {
  getStats: async (month?: string): Promise<DashboardStats> => {
    const response = await axiosInstance.get<DashboardStats>(
      `${API_BASE_URL}/dashboard/stats`,
      { params: month ? { month } : undefined },
    );
    return response.data;
  },

  getExpiringDocuments: async (): Promise<EmployeeWithExpiringDocs[]> => {
    const response = await axiosInstance.get<EmployeeWithExpiringDocs[]>(
      `${API_BASE_URL}/dashboard/expiring-documents`,
    );
    return response.data;
  },
};
