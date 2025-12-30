export interface HoursBreakdown {
  regular: Array<{
    rateVariantName: string;
    hours: number;
    rateMultiplier: number;
    hourlyRate: number;
    amount: number;
  }>;
  specialDays: Array<{
    specialDayName: string;
    hours: number;
    rateMultiplier: number;
    hourlyRate: number;
    amount: number;
  }>;
  offDays: Array<{
    date: string;
    hours: number;
    rateMultiplier: number;
    hourlyRate: number;
    amount: number;
  }>;
  idle: Array<{
    date: string;
    hours: number;
    rateMultiplier: number;
    hourlyRate: number;
    amount: number;
  }>;
}

export interface Payroll {
  id: number;
  employeeId: number;
  month: string;
  totalHours: number;
  totalOtHours: number;
  totalOffdaysWorkedHours: number;
  totalIdleDayHours: number;
  allowances: Record<string, any> | null;
  absentDaysDeductible: number;
  otherDeductions: Record<string, any> | null;
  notes: string | null;
  hoursBreakdown?: HoursBreakdown;
  baseHourlyRate?: number;
  totalGrossSalary?: number;
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

