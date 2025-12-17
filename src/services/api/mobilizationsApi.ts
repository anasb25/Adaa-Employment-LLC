import axiosInstance from '../../lib/axios';
import {
  Mobilization,
  CreateMobilizationRequest,
  BulkCreateMobilizationRequest,
  UpdateMobilizationRequest,
  MobilizationFilters,
  MobilizationStatistics,
} from '../../types/mobilization';

export const mobilizationsApi = {
  // Get all mobilizations with pagination and filters
  getAll: async (params?: MobilizationFilters & { page?: number; limit?: number }) => {
    const response = await axiosInstance.get('/mobilizations', { params });
    return response.data;
  },

  // Get a single mobilization by ID
  getById: async (id: number): Promise<Mobilization> => {
    const response = await axiosInstance.get(`/mobilizations/${id}`);
    return response.data;
  },

  // Get latest active mobilization for an employee
  getLatestForEmployee: async (employeeId: number): Promise<Mobilization | null> => {
    const response = await axiosInstance.get(`/mobilizations/employee/${employeeId}/latest`);
    return response.data;
  },

  // Get all employees currently mobilized to a project
  getEmployeesOnProject: async (projectId: number): Promise<Mobilization[]> => {
    const response = await axiosInstance.get(`/mobilizations/project/${projectId}/employees`);
    return response.data;
  },

  // Create a single mobilization
  create: async (data: CreateMobilizationRequest): Promise<Mobilization> => {
    const response = await axiosInstance.post('/mobilizations', data);
    return response.data;
  },

  // Create bulk mobilizations
  createBulk: async (data: BulkCreateMobilizationRequest): Promise<Mobilization[]> => {
    const response = await axiosInstance.post('/mobilizations/bulk', data);
    return response.data;
  },

  // Update a mobilization
  update: async (id: number, data: UpdateMobilizationRequest): Promise<Mobilization> => {
    const response = await axiosInstance.patch(`/mobilizations/${id}`, data);
    return response.data;
  },

  // Delete a mobilization
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/mobilizations/${id}`);
  },

  // Get statistics
  getStatistics: async (projectId?: number): Promise<MobilizationStatistics> => {
    const response = await axiosInstance.get('/mobilizations/statistics', {
      params: projectId ? { projectId } : {},
    });
    return response.data;
  },
};

