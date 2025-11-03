export enum EmployeeStatus {
  ACTIVE = "active",
  ON_VACATION = "on_vacation",
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
  status: EmployeeStatus;
  date_of_joining?: string;
  date_of_arrival?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
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
  status?: EmployeeStatus;
  date_of_joining?: string;
  date_of_arrival?: string;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {}
