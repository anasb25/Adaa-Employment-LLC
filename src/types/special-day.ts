export interface SpecialDay {
  id: number;
  name: string;
  category?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isActive: boolean;
  isRecurring: boolean;
  color?: string;
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
}

export interface UpdateSpecialDayRequest extends Partial<CreateSpecialDayRequest> {}

export interface SpecialDayFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  year?: number;
}

