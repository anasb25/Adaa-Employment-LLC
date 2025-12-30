import axiosInstance from "../../lib/axios";
import {
  SkillRate,
  CreateSkillRateRequest,
  BulkCreateSkillRatesRequest,
} from "../../types/rate-variant";
import { API_BASE_URL } from "../../lib/constants";

export const skillRatesApi = {
  // Get all rates for a skill
  getSkillRates: async (skillId: number) => {
    const response = await axiosInstance.get<SkillRate[]>(
      `${API_BASE_URL}/skills/${skillId}/rates`
    );
    return response.data;
  },

  // Create/update a single rate
  createSkillRate: async (
    skillId: number,
    data: CreateSkillRateRequest
  ) => {
    const response = await axiosInstance.post<SkillRate>(
      `${API_BASE_URL}/skills/${skillId}/rates`,
      data
    );
    return response.data;
  },

  // Create multiple rates at once
  bulkCreateSkillRates: async (
    skillId: number,
    data: BulkCreateSkillRatesRequest
  ) => {
    const response = await axiosInstance.post<SkillRate[]>(
      `${API_BASE_URL}/skills/${skillId}/rates/bulk`,
      data
    );
    return response.data;
  },

  // Delete a rate
  deleteSkillRate: async (skillId: number, rateVariantId: number) => {
    await axiosInstance.delete(
      `${API_BASE_URL}/skills/${skillId}/rates/${rateVariantId}`
    );
  },

  // Calculate final rate (handles multipliers)
  getCalculatedRate: async (skillId: number, rateVariantId: number) => {
    const response = await axiosInstance.get<{
      finalEmployeeRate: number;
      finalClientRate: number;
      rateDetails: SkillRate;
    }>(
      `${API_BASE_URL}/skills/${skillId}/rates/${rateVariantId}/calculate`
    );
    return response.data;
  },
};


