import { Employee } from "./employee";
import { Project } from "./project";

export interface ProjectAllocation {
  id: number;
  employeeId: number;
  projectId: number;
  startDate: string;
  endDate?: string;
  notes?: string;
  employee?: Employee;
  project?: Project;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAllocationRequest {
  projectId: number;
  startDate: string;
  endDate?: string;
  employeeIds: number[];
  notes?: string;
}

export interface UpdateAllocationRequest {
  startDate?: string;
  endDate?: string;
  notes?: string;
}
