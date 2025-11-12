import axiosInstance from "../../lib/axios";
import { SkillType } from "../../types/skill";

export const skillTypesApi = {
  getAll: async (): Promise<SkillType[]> => {
    const res = await axiosInstance.get<SkillType[]>("/skill-types");
    return res.data;
  },

  create: async (type: string): Promise<SkillType> => {
    const res = await axiosInstance.post<SkillType>("/skill-types", { type });
    return res.data;
  },

  update: async (id: number, type: string): Promise<SkillType> => {
    const res = await axiosInstance.put<SkillType>(`/skill-types/${id}`, {
      type,
    });
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/skill-types/${id}`);
  },
};
