export type ProjectStatus =
  | "planned"
  | "ongoing"
  | "on_hold"
  | "completed"
  | "cancelled";

export interface Project {
  id: number;
  name: string;
  location?: string;
  status: ProjectStatus;
  notes?: string;
  clientId: number;
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
