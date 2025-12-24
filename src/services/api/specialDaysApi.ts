import axiosInstance from "../../lib/axios";
import {
  SpecialDay,
  CreateSpecialDayRequest,
  UpdateSpecialDayRequest,
  SpecialDayFilters,
} from "../../types/special-day";

export const specialDaysApi = {
  getSpecialDays: async (filters?: SpecialDayFilters) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.year) params.append("year", filters.year.toString());

    const response = await axiosInstance.get<SpecialDay[]>(
      `/special-days?${params.toString()}`
    );
    return response.data;
  },

  getSpecialDay: async (id: number) => {
    const response = await axiosInstance.get<SpecialDay>(`/special-days/${id}`);
    return response.data;
  },

  createSpecialDay: async (data: CreateSpecialDayRequest) => {
    const response = await axiosInstance.post<SpecialDay>("/special-days", data);
    return response.data;
  },

  updateSpecialDay: async (id: number, data: UpdateSpecialDayRequest) => {
    const response = await axiosInstance.patch<SpecialDay>(`/special-days/${id}`, data);
    return response.data;
  },

  deleteSpecialDay: async (id: number) => {
    await axiosInstance.delete(`/special-days/${id}`);
  },

  checkDate: async (date: string) => {
    const response = await axiosInstance.get<SpecialDay | null>(
      `/special-days/check/${date}`
    );
    return response.data;
  },

  getRange: async (startDate: string, endDate: string) => {
    const response = await axiosInstance.get<SpecialDay[]>(
      `/special-days/range/${startDate}/${endDate}`
    );
    return response.data;
  },
};

