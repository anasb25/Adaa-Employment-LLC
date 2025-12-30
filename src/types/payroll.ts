export interface Payroll {
  id: number;
  employeeId: number;
  month: string;
  totalHours: number;
  totalOtHours: number;
  totalOffdaysWorkedHours: number;
  totalIdleDayHours: number;
  allowances: Record<string, any> | null;
  arrears: Record<string, any> | null;
  absentDaysDeductible: number;
  otherDeductions: Record<string, any> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    name: string;
    adaa_emp_code: string;
  };
}

export interface CreatePayrollRequest {
  employeeId: number;
  month: string;
  totalHours?: number;
  totalOtHours?: number;
  totalOffdaysWorkedHours?: number;
  totalIdleDayHours?: number;
  allowances?: Record<string, any>;
  arrears?: Record<string, any>;
  absentDaysDeductible?: number;
  otherDeductions?: Record<string, any>;
  notes?: string;
}

export interface UpdatePayrollRequest {
  totalHours?: number;
  totalOtHours?: number;
  totalOffdaysWorkedHours?: number;
  totalIdleDayHours?: number;
  allowances?: Record<string, any>;
  arrears?: Record<string, any>;
  absentDaysDeductible?: number;
  otherDeductions?: Record<string, any>;
  notes?: string;
}

export interface PayrollFilters {
  month?: string;
  employeeId?: number;
  page?: number;
  limit?: number;
}

