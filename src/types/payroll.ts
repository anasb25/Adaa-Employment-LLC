import type { AirTicketHistoryEntry } from "./employee";
import type { Supplier } from "./supplier";

export interface HoursBreakdown {
  regular: Array<{
    rateVariantName: string;
    hours: number;
    additionalAmount: number;
    hourlyRate: number;
    amount: number;
  }>;
  specialDays: Array<{
    specialDayName: string;
    hours: number;
    additionalAmount: number;
    hourlyRate: number;
    amount: number;
  }>;
  offDays: Array<{
    date: string;
    hours: number;
    additionalAmount: number;
    hourlyRate: number;
    amount: number;
  }>;
  idle: Array<{
    date: string;
    hours: number;
    additionalAmount: number;
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
  netSalary?: number | null;
  createdAt: string;
  updatedAt: string;
  /** Project / site name(s) for the payroll month (from approved timesheets). */
  siteName?: string;
  /** Mobilized labor trade for the payroll month. */
  laborTrade?: string;
  employee?: {
    id: number;
    name: string;
    adaa_emp_code: string;
    basic_salary?: number | null;
    hra?: number | null;
    other_allowance?: number | null;
    air_tickets?: number;
    air_tickets_history?: AirTicketHistoryEntry[];
    supplier?: Supplier | null;
  };
}

export interface PayrollMonthTotals {
  employeeCount: number;
  totalHours: number;
  totalOtHours: number;
  totalOffdaysWorkedHours: number;
  totalIdleDayHours: number;
  totalPaidHours: number;
  grossSalary: number;
  netSalary: number;
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

