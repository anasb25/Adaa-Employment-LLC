import axiosInstance from "../../lib/axios";
import {
  EmployeeSkill,
  AssignSkillRequest,
  UpdateSkillRatingRequest,
} from "../../types/skill";

export const employeeSkillsApi = {
  // Get all skills for an employee
  getEmployeeSkills: async (
    employeeId: number
  ): Promise<EmployeeSkill[]> => {
    const response = await axiosInstance.get<EmployeeSkill[]>(
      `/employees/${employeeId}/skills`
    );
    return response.data;
  },

  // Assign a skill to an employee with rating
  assignSkill: async (
    employeeId: number,
    data: AssignSkillRequest
  ): Promise<EmployeeSkill> => {
    const response = await axiosInstance.post<EmployeeSkill>(
      `/employees/${employeeId}/skills`,
      data
    );
    return response.data;
  },

  // Update skill rating for an employee
  updateSkillRating: async (
    employeeId: number,
    skillId: number,
    data: UpdateSkillRatingRequest
  ): Promise<EmployeeSkill> => {
    const response = await axiosInstance.put<EmployeeSkill>(
      `/employees/${employeeId}/skills/${skillId}/rating`,
      data
    );
    return response.data;
  },

  // Remove a skill from an employee
  removeSkill: async (
    employeeId: number,
    skillId: number
  ): Promise<void> => {
    await axiosInstance.delete(`/employees/${employeeId}/skills/${skillId}`);
  },
};

