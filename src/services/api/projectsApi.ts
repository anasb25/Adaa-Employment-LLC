import axiosInstance from "../../lib/axios";
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "../../types/project";
import { PaginatedResponse } from "./types";

export const projectsApi = {
  getProjects: async (
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<Project>> => {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    const res = await axiosInstance.get<PaginatedResponse<Project>>(
      `/projects${params.toString() ? `?${params.toString()}` : ""}`
    );
    return res.data;
  },

  searchProjects: async (
    q: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Project>> => {
    const res = await axiosInstance.get<PaginatedResponse<Project>>(
      `/projects/actions/search?q=${encodeURIComponent(
        q
      )}&page=${page}&limit=${limit}`
    );
    return res.data;
  },

  getProject: async (id: number): Promise<Project> => {
    const res = await axiosInstance.get<Project>(`/projects/${id}`);
    return res.data;
  },

  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const res = await axiosInstance.post<Project>("/projects", data);
    return res.data;
  },

  updateProject: async (
    id: number,
    data: UpdateProjectRequest
  ): Promise<Project> => {
    const res = await axiosInstance.put<Project>(`/projects/${id}`, data);
    return res.data;
  },

  deleteProject: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/projects/${id}`);
  },
};
