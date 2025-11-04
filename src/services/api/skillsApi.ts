import axiosInstance from "../../lib/axios";
import {
  Skill,
  CreateSkillRequest,
  UpdateSkillRequest,
} from "../../types/skill";

export interface SkillListResponse {
  data: Skill[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const skillsApi = {
  // Get all skills with pagination
  getSkills: async (
    page?: number,
    limit?: number
  ): Promise<SkillListResponse> => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    
    const queryString = params.toString();
    const response = await axiosInstance.get<SkillListResponse>(
      `/skills${queryString ? `?${queryString}` : ""}`
    );
    return response.data;
  },

  // Get a specific skill by ID
  getSkill: async (id: number): Promise<Skill> => {
    const response = await axiosInstance.get<Skill>(`/skills/${id}`);
    return response.data;
  },

  // Create a new skill
  createSkill: async (data: CreateSkillRequest): Promise<Skill> => {
    const response = await axiosInstance.post<Skill>("/skills", data);
    return response.data;
  },

  // Update a skill
  updateSkill: async (
    id: number,
    data: UpdateSkillRequest
  ): Promise<Skill> => {
    const response = await axiosInstance.put<Skill>(`/skills/${id}`, data);
    return response.data;
  },

  // Delete a skill
  deleteSkill: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/skills/${id}`);
  },

  // Search skills by type or skill name
  searchSkills: async (
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<SkillListResponse> => {
    const response = await axiosInstance.get<SkillListResponse>(
      `/skills/actions/search?q=${encodeURIComponent(
        query
      )}&page=${page}&limit=${limit}`
    );
    return response.data;
  },
};

