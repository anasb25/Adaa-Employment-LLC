import axiosInstance from "../../lib/axios";
import {
  RateVariant,
  CreateRateVariantRequest,
  UpdateRateVariantRequest,
} from "../../types/rate-variant";
import { API_BASE_URL } from "../../lib/constants";

export const rateVariantsApi = {
  getRateVariants: async () => {
    const response = await axiosInstance.get<RateVariant[]>(
      `${API_BASE_URL}/rate-variants`
    );
    return response.data;
  },

  getRateVariantById: async (id: number) => {
    const response = await axiosInstance.get<RateVariant>(
      `${API_BASE_URL}/rate-variants/${id}`
    );
    return response.data;
  },

  getBaseRate: async () => {
    const response = await axiosInstance.get<RateVariant>(
      `${API_BASE_URL}/rate-variants/base`
    );
    return response.data;
  },

  createRateVariant: async (data: CreateRateVariantRequest) => {
    const response = await axiosInstance.post<RateVariant>(
      `${API_BASE_URL}/rate-variants`,
      data
    );
    return response.data;
  },

  updateRateVariant: async (id: number, data: UpdateRateVariantRequest) => {
    const response = await axiosInstance.patch<RateVariant>(
      `${API_BASE_URL}/rate-variants/${id}`,
      data
    );
    return response.data;
  },

  deleteRateVariant: async (id: number) => {
    await axiosInstance.delete(`${API_BASE_URL}/rate-variants/${id}`);
  },
};



