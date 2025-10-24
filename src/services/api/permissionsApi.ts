import axiosInstance from "../../lib/axios";
import { Permission } from "../../types/auth";

export const permissionsApi = {
  // Get all permissions
  getPermissions: async (): Promise<Permission[]> => {
    const response = await axiosInstance.get<Permission[]>("/permissions");
    return response.data;
  },

  // Get a specific permission by ID
  getPermission: async (id: number): Promise<Permission> => {
    const response = await axiosInstance.get<Permission>(`/permissions/${id}`);
    return response.data;
  },

  // Create a new permission
  createPermission: async (data: Partial<Permission>): Promise<Permission> => {
    const response = await axiosInstance.post<Permission>("/permissions", data);
    return response.data;
  },

  // Update a permission
  updatePermission: async (
    id: number,
    data: Partial<Permission>
  ): Promise<Permission> => {
    const response = await axiosInstance.put<Permission>(
      `/permissions/${id}`,
      data
    );
    return response.data;
  },

  // Delete a permission
  deletePermission: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/permissions/${id}`);
  },

  // Create multiple permissions
  createMultiplePermissions: async (
    permissions: Partial<Permission>[]
  ): Promise<Permission[]> => {
    const response = await axiosInstance.post<Permission[]>(
      "/permissions/bulk",
      { permissions }
    );
    return response.data;
  },
};
