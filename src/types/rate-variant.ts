export interface RateVariant {
  id: number;
  name: string;
  description?: string;
  isBaseRate: boolean;
  displayOrder: number;
  isActive: boolean;
  color?: string;
  employeeRateMultiplier: number;
  minHours?: number | null;
  maxHours?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRateVariantRequest {
  name: string;
  description?: string;
  isBaseRate?: boolean;
  displayOrder?: number;
  isActive?: boolean;
  color?: string;
  employeeRateMultiplier?: number;
  minHours?: number | null;
  maxHours?: number | null;
}

export interface UpdateRateVariantRequest extends Partial<CreateRateVariantRequest> {}

export enum RateType {
  FLAT = 'flat',
  MULTIPLIER = 'multiplier',
}

// Skill Rates (at skill level)
export interface SkillRate {
  id: number;
  skillId: number;
  rateVariantId: number;
  rateType: RateType;
  employeeRateValue: number;
  clientRateValue: number;
  notes?: string;
  rateVariant?: RateVariant;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillRateRequest {
  rateVariantId: number;
  rateType: RateType;
  employeeRateValue: number;
  clientRateValue: number;
  notes?: string;
}

export interface BulkCreateSkillRatesRequest {
  rates: CreateSkillRateRequest[];
}

// Employee Skill Rates
export interface EmployeeSkillRate {
  id: number;
  employeeSkillId: number;
  rateVariantId: number;
  rateType: RateType;
  rateValue: number;
  notes?: string;
  rateVariant?: RateVariant;
  createdAt: string;
  updatedAt: string;
}

// Project Skill Rates
export interface ProjectSkillRate {
  id: number;
  projectId: number;
  skillId: number;
  rateVariantId: number;
  rateType: RateType;
  rateValue: number;
  notes?: string;
  rateVariant?: RateVariant;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectSkillRateRequest {
  rateVariantId: number;
  rateType: RateType;
  rateValue: number;
  notes?: string;
}

export interface BulkCreateProjectSkillRatesRequest {
  rates: CreateProjectSkillRateRequest[];
}

export interface ProjectSkillWithRates {
  skillId: number;
  skillName: string;
  rates: ProjectSkillRate[];
}

