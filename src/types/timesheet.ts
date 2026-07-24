export enum TimesheetStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface Timesheet {
  id: number;
  projectId: number;
  month: string; // YYYY-MM
  status: TimesheetStatus;
  submittedAt: string | null;
  submittedBy: number | null;
  approvedAt: string | null;
  approvedBy: number | null;
  notes: string | null;
  project?: {
    id: number;
    name: string;
    client?: {
      id: number;
      name: string;
    };
  };
  entries?: TimesheetEntry[];
}

export interface TimesheetEntry {
  id: number;
  timesheetId: number;
  employeeId: number;
  date: string;
  tradeInSiteId: number | null;
  hoursWorked: number;
  jobStatus: string;
  notes: string | null;
  employee?: {
    id: number;
    name: string;
    adaa_emp_code: string;
  };
  tradeInSite?: {
    id: number;
    skill: string;
  };
}

export interface DailyHours {
  date: string;
  day: number;
  hoursWorked: number;
  jobStatus: string | null;
  notes: string | null;
  entryId: number | null;
  /** e.g. forced Sunday off for idle rows on virtual project id 0 (not annual leave) */
  isOffDay?: boolean;
}

export interface EmployeeTimesheet {
  srNo: number;
  employeeId: number;
  idNo: string;
  name: string;
  trade: string;
  dailyHours: DailyHours[];
}

/** project.id === 0 means idle + annual-leave monthly sheet (no real project) */
export const IDLE_PROJECT_ID = 0;

export interface MonthlyProjectTimesheetData {
  timesheet: Timesheet | null;
  project: {
    id: number;
    name: string;
    fat?: string | null;
    client: {
      id: number;
      name: string;
    };
  };
  employees: EmployeeTimesheet[];
}

export interface CreateTimesheetRequest {
  projectId?: number | null; // null = idle employees timesheet
  month: string;
  notes?: string;
}

export interface SaveTimesheetEntriesRequest {
  entries: {
    employeeId: number;
    date: string;
    tradeInSiteId?: number;
    hoursWorked: number;
    jobStatus: string;
    notes?: string;
  }[];
}

export interface SubmitTimesheetRequest {
  notes?: string;
}

export interface ApproveTimesheetRequest {
  status: TimesheetStatus.APPROVED | TimesheetStatus.REJECTED;
  notes?: string;
}

export interface TimesheetFilters {
  projectId?: number;
  month?: string;
  status?: TimesheetStatus;
}

// Daily Utilization Report Types
export interface TradeUtilization {
  tradeInSite: string;
  supplier: string;
  headCount: number;
}

export interface ProjectUtilization {
  projectId: number;
  projectName: string;
  location: string | null;
  fat: string | null;
  trades: TradeUtilization[];
}

export interface ClientUtilization {
  clientId: number;
  clientName: string;
  projects: ProjectUtilization[];
  total: number;
}

export interface DailyUtilizationReport {
  date: string;
  clients: ClientUtilization[];
  totalManpower: number;
}
