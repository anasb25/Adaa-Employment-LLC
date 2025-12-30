export enum SpecialDayType {
  MANDATORY_OFF = "mandatory_off",
  OPTIONAL_OFF = "optional_off",
  PREMIUM_RATE = "premium_rate",
  REGULAR = "regular",
}

export interface SpecialDay {
  id: number;
  name: string;
  category?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  description?: string;
  isActive: boolean;
  isRecurring: boolean;
  color?: string;
  dayType: SpecialDayType;
  employeeRateMultiplier: number;
  isDefaultOff: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpecialDayRequest {
  name: string;
  category?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isActive?: boolean;
  isRecurring?: boolean;
  color?: string;
  dayType?: SpecialDayType;
  employeeRateMultiplier?: number;
  isDefaultOff?: boolean;
  notes?: string;
}

export interface UpdateSpecialDayRequest extends Partial<CreateSpecialDayRequest> {}

export interface SpecialDayFilters {
  name?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isRecurring?: boolean;
  year?: number;
}

export interface SpecialDayRates {
  isSpecialDay: boolean;
  specialDay: SpecialDay | null;
  clientRateMultiplier: number;
  employeeRateMultiplier: number;
  isDefaultOff: boolean;
  isMandatoryOff: boolean;
  dayType: SpecialDayType | null;
}
