import { EmployeeSkill } from "./skill";

export interface AirTicketHistoryEntry {
  at: string;
  type: "add" | "subtract";
  amount: number;
  balance_after: number;
  reason?: string;
}

export interface LatestMobilization {
  jobStatus: string;
  mobStatus: string;
  projectName: string | null;
}

export interface Employee {
  id: number;
  adaa_emp_code: string;
  name: string;
  dob?: string;
  pp_no?: string;
  pp_expiry?: string;
  nationality?: string;
  emirates_id?: string;
  emirates_id_expiry?: string;
  visa_expiry?: string;
  work_permit_no?: string;
  work_permit_expiry?: string;
  personal_code?: string;
  contact_no?: string;
  date_of_joining?: string;
  date_of_arrival?: string;
  basic_salary?: number | null;
  hra?: number | null;
  other_allowance?: number | null;
  air_tickets?: number;
  air_tickets_history?: AirTicketHistoryEntry[];
  annual_leave_balance?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  employeeSkills?: EmployeeSkill[];
  latestMobilization?: LatestMobilization | null;
}

export interface CreateEmployeeRequest {
  adaa_emp_code: string;
  name: string;
  dob?: string;
  pp_no?: string;
  pp_expiry?: string;
  nationality?: string;
  emirates_id?: string;
  emirates_id_expiry?: string;
  visa_expiry?: string;
  work_permit_no?: string;
  work_permit_expiry?: string;
  personal_code?: string;
  contact_no?: string;
  date_of_joining?: string;
  date_of_arrival?: string;
  basic_salary?: number;
  hra?: number;
  other_allowance?: number;
  air_tickets?: number;
  annual_leave_balance?: number;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {}
