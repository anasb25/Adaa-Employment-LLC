export type ProjectStatus =
  | "planned"
  | "ongoing"
  | "on_hold"
  | "completed"
  | "cancelled";

export type ProjectFAT = "ADAA" | "CLIENT";

import { Client } from "./client";
import { ProjectSkill } from "./skill";

export interface Project {
  id: number;
  name: string;
  location?: string;
  status: ProjectStatus;
  notes?: string;
  fat?: ProjectFAT;
  clientId: number;
  client?: Client;
  projectSkills?: ProjectSkill[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  location?: string;
  status?: ProjectStatus;
  notes?: string;
  fat?: ProjectFAT;
  clientId: number;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}
