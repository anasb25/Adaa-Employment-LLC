export interface RateVariant {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  color?: string;
  employeeAdditionalAmount: number;
  clientRateMultiplier: number;
  minHours?: number | null;
  maxHours?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRateVariantRequest {
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  color?: string;
  employeeAdditionalAmount?: number;
  clientRateMultiplier?: number;
  minHours?: number | null;
  maxHours?: number | null;
}

export interface UpdateRateVariantRequest extends Partial<CreateRateVariantRequest> {}

