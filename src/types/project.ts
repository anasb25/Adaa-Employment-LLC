export type ProjectFAT = "ADAA" | "CLIENT";

import { Client } from "./client";
import { ProjectSkill } from "./skill";
import { SpecialDay } from "./special-day";
import { RateVariant } from "./rate-variant";

export interface ProjectSpecialDayRate {
  id: number;
  projectId: number;
  specialDayId: number;
  clientRateMultiplier: number;
  specialDay?: SpecialDay;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRateVariantRate {
  id: number;
  projectId: number;
  rateVariantId: number;
  clientRateMultiplier: number;
  rateVariant?: RateVariant;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  location?: string;
  notes?: string;
  fat?: ProjectFAT;
  offDays?: string[];
  offDayMultiplier?: number;
  clientId: number;
  client?: Client;
  projectSkills?: ProjectSkill[];
  specialDayRates?: ProjectSpecialDayRate[];
  rateVariantRates?: ProjectRateVariantRate[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSpecialDayRateRequest {
  specialDayId: number;
  clientRateMultiplier: number;
}

export interface ProjectRateVariantRateRequest {
  rateVariantId: number;
  clientRateMultiplier: number;
}

export interface CreateProjectRequest {
  name: string;
  location?: string;
  notes?: string;
  fat?: ProjectFAT;
  offDays?: string[];
  offDayMultiplier?: number;
  specialDayRates?: ProjectSpecialDayRateRequest[];
  rateVariantRates?: ProjectRateVariantRateRequest[];
  clientId: number;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}
