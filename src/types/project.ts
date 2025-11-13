export type ProjectStatus =
  | "planned"
  | "ongoing"
  | "on_hold"
  | "completed"
  | "cancelled";

import { Client } from "./client";
import { ProjectSkill } from "./skill";

export interface Project {
  id: number;
  name: string;
  location?: string;
  status: ProjectStatus;
  notes?: string;
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
  clientId: number;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}
