import axiosInstance from "../../lib/axios";
import { EmployeeWithExpiringDocs } from "../../types/dashboard";
import { API_BASE_URL } from "../../lib/constants";

export const dashboardApi = {
  getExpiringDocuments: async (): Promise<EmployeeWithExpiringDocs[]> => {
    const response = await axiosInstance.get<EmployeeWithExpiringDocs[]>(
      `${API_BASE_URL}/dashboard/expiring-documents`
    );
    return response.data;
  },
};

