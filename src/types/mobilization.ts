export enum MobStatus {
  MOBILIZED = 'mobilized',
  DEMOBILIZED = 'demobilized',
}

export enum JobStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  ABSCONDED = 'absconded',
  ON_VACATION = 'on_vacation',
  ABSENT = 'absent',
  SICK_LEAVE = 'sick_leave',
  CASUAL_LEAVE = 'casual_leave',
  NOTICE_PERIOD = 'notice_period',
  RESIGNED = 'resigned',
  IDLE = 'idle',
  OFF = 'off',
}

export interface Mobilization {
  id: number;
  employeeId: number;
  mobilizedTradeId: number;
  projectId: number | null;
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
  mobStatus: MobStatus;
  jobStatus: JobStatus;
  actionDate: string;
  notes?: string;
}

export interface BulkCreateMobilizationRequest {
  employeeIds: number[];
  mobilizedTradeId: number;
  projectId?: number | null;
  mobStatus: MobStatus;
  jobStatus: JobStatus;
  actionDate: string;
  notes?: string;
}

export interface UpdateMobilizationRequest {
  employeeId?: number;
  mobilizedTradeId?: number;
  projectId?: number | null;
  mobStatus?: MobStatus;
  jobStatus?: JobStatus;
  actionDate?: string;
  notes?: string;
}

export interface MobilizationFilters {
  employeeId?: number;
  projectId?: number;
  mobilizedTradeId?: number;
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
    active: number;
    cancelled: number;
    absconded: number;
    on_vacation: number;
    absent: number;
    sick_leave: number;
    casual_leave: number;
    notice_period: number;
    resigned: number;
    idle: number;
    off: number;
  };
  byProject: Array<{
    project: string;
    count: number;
  }>;
}

