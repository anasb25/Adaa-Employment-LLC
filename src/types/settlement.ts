import { Employee } from "./employee";

export enum ContractType {
  LIMITED = "LIMITED",
  UNLIMITED = "UNLIMITED",
}

export enum SettlementStatus {
  DRAFT = "draft",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  PAID = "paid",
  CANCELLED = "cancelled",
}

// Payment item for the settlement
export interface PaymentItem {
  description: string;
  forDays?: number;
  fromDate?: string;
  toDate?: string;
  amount: number;
}

// Deduction item for the settlement
export interface DeductionItem {
  description: string;
  amount: number;
}

export interface Settlement {
  id: number;
  employeeId: number;
  employee?: Employee;
  
  // Employee details at time of settlement
  empCode: string;
  empName: string;
  jobTitle?: string;
  dateOfJoin?: string;
  lastDateOfWork?: string;
  lastTotalSalary?: number;
  totalDaysAbsent?: number;
  lastMonthSalaryPaid?: boolean;
  
  // Gratuity eligibility
  eligibleForGratuity: boolean;
  gratuityDaysPerYear?: number;
  gratuityReason?: string;
  
  // Salary breakdown
  hourlySalary?: number;
  hourlyRate?: number;
  allowance?: number;
  transportAllowance?: number;
  otherAllowances?: number;
  totalYearsOfService?: number;
  annualLeaveBalance?: number;
  contractType?: ContractType;
  
  // Payment details
  paymentItems: PaymentItem[];
  totalDue: number;
  
  // Deduction details
  deductionItems: DeductionItem[];
  totalDeduction: number;
  
  // Final amount
  finalAmount: number;
  
  // Acknowledgment details
  passportNo?: string;
  
  // Status and dates
  status: SettlementStatus;
  preparedBy?: number;
  checkedBy?: number;
  approvedBy?: number;
  
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
}

export interface CreateSettlementRequest {
  employeeId: number;
  
  // Employee details
  empCode: string;
  empName: string;
  jobTitle?: string;
  dateOfJoin?: string;
  lastDateOfWork?: string;
  lastTotalSalary?: number;
  totalDaysAbsent?: number;
  lastMonthSalaryPaid?: boolean;
  
  // Gratuity eligibility
  eligibleForGratuity: boolean;
  gratuityDaysPerYear?: number;
  gratuityReason?: string;
  
  // Salary breakdown
  hourlySalary?: number;
  hourlyRate?: number;
  allowance?: number;
  transportAllowance?: number;
  otherAllowances?: number;
  totalYearsOfService?: number;
  annualLeaveBalance?: number;
  contractType?: ContractType;
  
  // Payment and deduction details
  paymentItems: PaymentItem[];
  deductionItems: DeductionItem[];
  
  // Acknowledgment
  passportNo?: string;
  
  status?: SettlementStatus;
}

export interface UpdateSettlementRequest
  extends Partial<CreateSettlementRequest> {}

export interface SettlementListResponse {
  data: Settlement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
