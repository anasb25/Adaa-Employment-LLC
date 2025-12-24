export type ProjectFAT = "ADAA" | "CLIENT";

import { Client } from "./client";
import { ProjectSkill } from "./skill";

export interface Project {
  id: number;
  name: string;
  location?: string;
  notes?: string;
  fat?: ProjectFAT;
  offDays?: string[];
  clientId: number;
  client?: Client;
  projectSkills?: ProjectSkill[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  location?: string;
  notes?: string;
  fat?: ProjectFAT;
  offDays?: string[];
  clientId: number;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}
