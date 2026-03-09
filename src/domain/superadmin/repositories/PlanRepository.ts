import {
  PlanFeatureKey,
  PlanLimitKey,
  PlanModuleKey,
} from "@/prisma/generated/client";

export interface CreatePlanDTO {
  name: string;
  description?: string;
  currency?: string;
  priceMonthly: number;
  priceYearly?: number;
  trialDays?: number;
  isActive?: boolean;
  sortOrder?: number;
  features?: PlanFeatureKey[];
  limits?: { limitKey: PlanLimitKey; limit: number }[];
  modules?: PlanModuleKey[];
}

export interface UpdatePlanDTO {
  name?: string;
  description?: string;
  currency?: string;
  priceMonthly?: number;
  priceYearly?: number;
  trialDays?: number;
  isActive?: boolean;
  sortOrder?: number;
  features?: PlanFeatureKey[];
  limits?: { limitKey: PlanLimitKey; limit: number }[];
  modules?: PlanModuleKey[];
}

export interface PlanRepository {
  create(tenantId: string, data: CreatePlanDTO): Promise<any>;
  update(id: string, data: UpdatePlanDTO): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(tenantId?: string): Promise<any[]>;
  delete(id: string): Promise<any>;
}
