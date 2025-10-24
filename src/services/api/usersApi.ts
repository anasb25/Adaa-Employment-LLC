import axiosInstance from "../../lib/axios";
import { User } from "../../types/auth";

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export interface UserStatusResponse {
  message: string;
  user: User;
}

export interface UpdateUserRoleRequest {
  roleId: number;
}

export interface UserRoleResponse {
  message: string;
  user: User;
}

export const usersApi = {
  // Get all users with pagination
  getUsers: async (
    page: number = 1,
    limit: number = 10
  ): Promise<UserListResponse> => {
    const response = await axiosInstance.get<UserListResponse>(
      `/users?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get a specific user by ID
  getUser: async (id: number): Promise<User> => {
    const response = await axiosInstance.get<User>(`/users/${id}`);
    return response.data;
  },

  // Update user active/inactive status
  updateUserStatus: async (
    id: number,
    data: UpdateUserStatusRequest
  ): Promise<UserStatusResponse> => {
    const response = await axiosInstance.put<UserStatusResponse>(
      `/users/${id}/status`,
      data
    );
    return response.data;
  },

  // Search users by name or email
  searchUsers: async (
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<UserListResponse> => {
    const response = await axiosInstance.get<UserListResponse>(
      `/users/actions/search?q=${encodeURIComponent(
        query
      )}&page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Update user role
  updateUserRole: async (
    id: number,
    data: UpdateUserRoleRequest
  ): Promise<UserRoleResponse> => {
    const response = await axiosInstance.post<UserRoleResponse>(
      `/users/${id}/role`,
      data
    );
    return response.data;
  },
};
