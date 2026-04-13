import axiosInstance from "../../lib/axios";
import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
} from "../../types/client";
import { PaginatedResponse } from "./types";

export const clientsApi = {
  getClients: async (
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<Client>> => {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    const res = await axiosInstance.get<PaginatedResponse<Client>>(
      `/clients${params.toString() ? `?${params.toString()}` : ""}`
    );
    return res.data;
  },

  searchClients: async (
    q: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Client>> => {
    const res = await axiosInstance.get<PaginatedResponse<Client>>(
      `/clients/actions/search?q=${encodeURIComponent(
        q
      )}&page=${page}&limit=${limit}`
    );
    return res.data;
  },

  getClient: async (id: number): Promise<Client> => {
    const res = await axiosInstance.get<Client>(`/clients/${id}`);
    return res.data;
  },

  createClient: async (data: CreateClientRequest): Promise<Client> => {
    const res = await axiosInstance.post<Client>("/clients", data);
    return res.data;
  },

  updateClient: async (
    id: number,
    data: UpdateClientRequest
  ): Promise<Client> => {
    const res = await axiosInstance.put<Client>(`/clients/${id}`, data);
    return res.data;
  },

  deleteClient: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/clients/${id}`);
  },

  deleteMany: async (ids: number[]): Promise<{ deleted: number }> => {
    const response = await axiosInstance.post<{ deleted: number }>(
      "/clients/actions/delete-many",
      { ids }
    );
    return response.data;
  },
};
