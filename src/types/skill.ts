export interface Skill {
  id: number;
  skill: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  skillType?: SkillType;
  skillTypeId?: number;
  sale_price?: number;
  employeeSkills?: EmployeeSkill[];
}

export interface EmployeeSkill {
  id: number;
  employeeId: number;
  skillId: number;
  rating: number;
  cost_price?: number | null;
  skill: Skill;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillRequest {
  skillTypeId: number;
  skill: string;
  sale_price?: number;
}

export interface UpdateSkillRequest extends Partial<CreateSkillRequest> {}

export interface AssignSkillRequest {
  skillId: number;
  rating: number;
  cost_price?: number;
}

export interface ProjectSkill {
  id: number;
  projectId: number;
  skillId: number;
  sale_price?: number;
  skill: Skill;
  createdAt: string;
  updatedAt: string;
}

export interface AssignProjectSkillRequest {
  skillId: number;
  sale_price?: number;
}

export interface UpdateProjectSkillRequest {
  sale_price?: number;
}

export interface UpdateSkillRatingRequest {
  rating: number;
}

export interface SkillType {
  id: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}
