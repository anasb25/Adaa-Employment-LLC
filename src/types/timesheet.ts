import { ProjectAllocation } from "./allocation";
import { Skill } from "./skill";
import { Employee } from "./employee";

export enum AttendanceStatus {
  ACTIVE = "active", // Employee was present as expected
  ON_HOLD = "on_hold", // Employee was not present
  IDLE = "idle", // Employee not allocated to any project (default)
}

export interface Timesheet {
  id: number;
  allocationId?: number | null;
  employeeId?: number | null;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  tradeInSiteId?: number; // The skill they actually worked as on site
  hoursWorked: number; // Default 10, minimum 0
  notes?: string;

  // Relations
  allocation?: ProjectAllocation | null;
  employee?: Employee | null; // Direct employee reference for idle employees
  tradeInSite?: Skill; // The skill they worked as on site

  createdAt: string;
  updatedAt: string;
}

export interface CreateTimesheetRequest {
  allocationId?: number;
  employeeId?: number;
  date: string;
  status: AttendanceStatus;
  tradeInSiteId?: number;
  hoursWorked: number;
  notes?: string;
}

export interface BulkCreateTimesheetRequest {
  timesheets: CreateTimesheetRequest[];
}

export interface UpdateTimesheetRequest {
  status?: AttendanceStatus;
  tradeInSiteId?: number;
  hoursWorked?: number;
  notes?: string;
}

export interface TimesheetFilters {
  projectId?: number;
  employeeId?: number;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}

export interface TimesheetStats {
  totalHours: number;
  totalDays: number;
  activeCount: number;
  onHoldCount: number;
  idleCount: number;
}
