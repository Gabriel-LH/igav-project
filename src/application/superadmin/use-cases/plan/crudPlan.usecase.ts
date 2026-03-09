import {
  PlanRepository,
  CreatePlanDTO,
  UpdatePlanDTO,
} from "@/src/domain/superadmin/repositories/PlanRepository";
import { PrismaPlanAdapter } from "@/src/infrastructure/superadmin/stores-adapters/prisma-plan.adapter";

export class CrudPlanUseCase {
  private planRepository: PlanRepository;

  constructor() {
    this.planRepository = new PrismaPlanAdapter();
  }

  async executeCreate(tenantId: string, data: CreatePlanDTO) {
    if (!tenantId) {
      throw new Error("Tenant ID is required to create a plan");
    }
    if (!data.name || data.priceMonthly === undefined) {
      throw new Error("Name and priceMonthly are required");
    }
    return this.planRepository.create(tenantId, data);
  }

  async executeUpdate(id: string, data: UpdatePlanDTO) {
    if (!id) {
      throw new Error("Plan ID is required");
    }
    return this.planRepository.update(id, data);
  }

  async executeFindById(id: string) {
    if (!id) {
      throw new Error("Plan ID is required");
    }
    return this.planRepository.findById(id);
  }

  async executeFindAll(tenantId?: string) {
    return this.planRepository.findAll(tenantId);
  }

  async executeDelete(id: string) {
    if (!id) {
      throw new Error("Plan ID is required");
    }
    return this.planRepository.delete(id);
  }
}
