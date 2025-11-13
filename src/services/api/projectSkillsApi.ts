import api from "../../lib/axios";
import {
  ProjectSkill,
  AssignProjectSkillRequest,
  UpdateProjectSkillRequest,
} from "../../types/skill";

export const projectSkillsApi = {
  getProjectSkills: async (projectId: number): Promise<ProjectSkill[]> => {
    const response = await api.get<ProjectSkill[]>(
      `/projects/${projectId}/skills`
    );
    return response.data;
  },

  assignSkillToProject: async (
    projectId: number,
    data: AssignProjectSkillRequest
  ): Promise<ProjectSkill> => {
    const response = await api.post<ProjectSkill>(
      `/projects/${projectId}/skills`,
      data
    );
    return response.data;
  },

  updateSalePrice: async (
    projectId: number,
    skillId: number,
    data: UpdateProjectSkillRequest
  ): Promise<ProjectSkill> => {
    const response = await api.put<ProjectSkill>(
      `/projects/${projectId}/skills/${skillId}`,
      data
    );
    return response.data;
  },

  removeSkillFromProject: async (
    projectId: number,
    skillId: number
  ): Promise<void> => {
    await api.delete(`/projects/${projectId}/skills/${skillId}`);
  },
};
