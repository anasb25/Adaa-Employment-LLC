export enum MobilizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum MobStatus {
  MOBILIZED = 'mobilized',
  DEMOBILIZED = 'demobilized',
}

export enum JobStatus {
  ON_JOB = 'on_job',
  CANCELLED = 'cancelled',
  ON_VACATION = 'on_vacation',
  ABSCONDED = 'absconded',
}

export interface Mobilization {
  id: number;
  employeeId: number;
  mobilizedTradeId: number;
  projectId: number | null;
  status: MobilizationStatus;
  mobStatus: MobStatus;
  jobStatus: JobStatus;
  actionDate: string;
  notes: string | null;
  employee?: {
    id: number;
    name: string;
    adaa_emp_code: string;
  };
  project?: {
    id: number;
    name: string;
    location: string;
    client: {
      id: number;
      name: string;
    };
  } | null;
  mobilizedTrade?: {
    id: number;
    skill: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMobilizationRequest {
  employeeId: number;
  mobilizedTradeId: number;
  projectId?: number | null;
  status?: MobilizationStatus;
  mobStatus: MobStatus;
  jobStatus: JobStatus;
  actionDate: string;
  notes?: string;
}

export interface BulkCreateMobilizationRequest {
  employeeIds: number[];
  mobilizedTradeId: number;
  projectId?: number | null;
  status?: MobilizationStatus;
  mobStatus: MobStatus;
  jobStatus: JobStatus;
  actionDate: string;
  notes?: string;
}

export interface UpdateMobilizationRequest {
  employeeId?: number;
  mobilizedTradeId?: number;
  projectId?: number | null;
  status?: MobilizationStatus;
  mobStatus?: MobStatus;
  jobStatus?: JobStatus;
  actionDate?: string;
  notes?: string;
}

export interface MobilizationFilters {
  employeeId?: number;
  projectId?: number;
  mobilizedTradeId?: number;
  status?: MobilizationStatus;
  mobStatus?: MobStatus;
  jobStatus?: JobStatus;
  actionDate?: string;
  startDate?: string;
  endDate?: string;
}

export interface MobilizationStatistics {
  total: number;
  byMobStatus: {
    mobilized: number;
    demobilized: number;
  };
  byJobStatus: {
    on_job: number;
    cancelled: number;
    on_vacation: number;
    absconded: number;
  };
  byProject: Array<{
    project: string;
    count: number;
  }>;
}

