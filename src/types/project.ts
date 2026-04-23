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
  /**
   * When `false`, the special day is NOT applied to this project at all
   * (overrides global rules, multipliers, and billing-hours behaviour).
   * Defaults to `true`.
   */
  isEnabled: boolean;
  specialDay?: SpecialDay;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRateVariantRate {
  id: number;
  projectId: number;
  rateVariantId: number;
  clientRateMultiplier: number;
  /**
   * When `false`, the rate variant is NOT applied to this project.
   * Its hours fall through to the regular/base rate during invoicing
   * and payroll. Defaults to `true`.
   */
  isEnabled: boolean;
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
  /** Defaults to `true` on the server when omitted. */
  isEnabled?: boolean;
}

export interface ProjectRateVariantRateRequest {
  rateVariantId: number;
  clientRateMultiplier: number;
  /** Defaults to `true` on the server when omitted. */
  isEnabled?: boolean;
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
