export interface Skill {
  id: number;
  skill: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  skillType?: SkillType;
  skillTypeId?: number;
  employeeSkills?: EmployeeSkill[];
}

export interface EmployeeSkill {
  id: number;
  employeeId: number;
  skillId: number;
  rating: number;
  skill: Skill;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillRequest {
  skillTypeId: number;
  skill: string;
}

export interface UpdateSkillRequest extends Partial<CreateSkillRequest> {}

export interface AssignSkillRequest {
  skillId: number;
  rating: number;
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
