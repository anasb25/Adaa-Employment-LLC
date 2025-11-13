import axiosInstance from "../../lib/axios";
import {
  ProjectAllocation,
  CreateAllocationRequest,
  UpdateAllocationRequest,
} from "../../types/allocation";
import { PaginatedResponse } from "./types";

export const allocationsApi = {
  getAllocations: async (
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<ProjectAllocation>> => {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    const res = await axiosInstance.get<PaginatedResponse<ProjectAllocation>>(
      `/project-allocations${params.toString() ? `?${params.toString()}` : ""}`
    );
    return res.data;
  },

  searchAllocations: async (
    q: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<ProjectAllocation>> => {
    const res = await axiosInstance.get<PaginatedResponse<ProjectAllocation>>(
      `/project-allocations/actions/search?q=${encodeURIComponent(
        q
      )}&page=${page}&limit=${limit}`
    );
    return res.data;
  },

  getAllocation: async (id: number): Promise<ProjectAllocation> => {
    const res = await axiosInstance.get<ProjectAllocation>(
      `/project-allocations/${id}`
    );
    return res.data;
  },

  getAllocationsByProject: async (
    projectId: number
  ): Promise<ProjectAllocation[]> => {
    const res = await axiosInstance.get<ProjectAllocation[]>(
      `/project-allocations/by-project/${projectId}`
    );
    return res.data;
  },

  getAllocationsByEmployee: async (
    employeeId: number
  ): Promise<ProjectAllocation[]> => {
    const res = await axiosInstance.get<ProjectAllocation[]>(
      `/project-allocations/by-employee/${employeeId}`
    );
    return res.data;
  },

  createAllocation: async (
    data: CreateAllocationRequest
  ): Promise<ProjectAllocation> => {
    const res = await axiosInstance.post<ProjectAllocation>(
      "/project-allocations",
      data
    );
    return res.data;
  },

  updateAllocation: async (
    id: number,
    data: UpdateAllocationRequest
  ): Promise<ProjectAllocation> => {
    const res = await axiosInstance.put<ProjectAllocation>(
      `/project-allocations/${id}`,
      data
    );
    return res.data;
  },

  deleteAllocation: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/project-allocations/${id}`);
  },
};
