export interface Skill {
  id: number;
  type: string;
  skill: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
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
  type: string;
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

