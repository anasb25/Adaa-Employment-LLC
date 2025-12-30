import axiosInstance from "../../lib/axios";
import {
  ProjectSkillRate,
  CreateProjectSkillRateRequest,
  BulkCreateProjectSkillRatesRequest,
  ProjectSkillWithRates,
} from "../../types/rate-variant";
import { API_BASE_URL } from "../../lib/constants";

export const projectSkillRatesApi = {
  // Get all rates for a specific skill in a project
  getSkillRates: async (projectId: number, skillId: number) => {
    const response = await axiosInstance.get<ProjectSkillRate[]>(
      `${API_BASE_URL}/projects/${projectId}/skills/${skillId}/rates`
    );
    return response.data;
  },

  // Get all rates for all skills in a project
  getAllProjectRates: async (projectId: number) => {
    const response = await axiosInstance.get<ProjectSkillWithRates[]>(
      `${API_BASE_URL}/projects/${projectId}/skills/rates/all`
    );
    return response.data;
  },

  // Create a single rate
  createSkillRate: async (
    projectId: number,
    skillId: number,
    data: CreateProjectSkillRateRequest
  ) => {
    const response = await axiosInstance.post<ProjectSkillRate>(
      `${API_BASE_URL}/projects/${projectId}/skills/${skillId}/rates`,
      data
    );
    return response.data;
  },

  // Create multiple rates at once
  bulkCreateSkillRates: async (
    projectId: number,
    skillId: number,
    data: BulkCreateProjectSkillRatesRequest
  ) => {
    const response = await axiosInstance.post<ProjectSkillRate[]>(
      `${API_BASE_URL}/projects/${projectId}/skills/${skillId}/rates/bulk`,
      data
    );
    return response.data;
  },

  // Delete a rate
  deleteSkillRate: async (
    projectId: number,
    skillId: number,
    rateVariantId: number
  ) => {
    await axiosInstance.delete(
      `${API_BASE_URL}/projects/${projectId}/skills/${skillId}/rates/${rateVariantId}`
    );
  },

  // Calculate the applicable rate (handles multipliers)
  getApplicableRate: async (
    projectId: number,
    skillId: number,
    rateVariantId: number
  ) => {
    const response = await axiosInstance.get<{
      finalRate: number;
      rateDetails: ProjectSkillRate;
    }>(
      `${API_BASE_URL}/projects/${projectId}/skills/${skillId}/rates/${rateVariantId}/calculate`
    );
    return response.data;
  },
};


