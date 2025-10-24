import axiosInstance from "../../lib/axios";
import { Role } from "../../types/auth";

export const rolesApi = {
  // Get all roles
  getRoles: async (): Promise<Role[]> => {
    const response = await axiosInstance.get<Role[]>("/roles");
    return response.data;
  },

  // Get a specific role by ID
  getRole: async (id: number): Promise<Role> => {
    const response = await axiosInstance.get<Role>(`/roles/${id}`);
    return response.data;
  },

  // Create a new role
  createRole: async (data: Partial<Role>): Promise<Role> => {
    const response = await axiosInstance.post<Role>("/roles", data);
    return response.data;
  },

  // Update a role
  updateRole: async (id: number, data: Partial<Role>): Promise<Role> => {
    const response = await axiosInstance.put<Role>(`/roles/${id}`, data);
    return response.data;
  },

  // Delete a role
  deleteRole: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/roles/${id}`);
  },

  // Assign permissions to a role
  assignPermissions: async (
    roleId: number,
    permissionIds: number[]
  ): Promise<Role> => {
    const response = await axiosInstance.post<Role>(
      `/roles/${roleId}/permissions`,
      { permissionIds }
    );
    return response.data;
  },
};
