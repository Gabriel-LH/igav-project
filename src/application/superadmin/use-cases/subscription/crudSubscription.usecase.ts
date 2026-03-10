import { 
  SubscriptionRepository, 
  CreateSubscriptionDTO 
} from "@/src/domain/superadmin/repositories/SubscriptionRepository";
import { PrismaSubscriptionAdapter } from "@/src/infrastructure/superadmin/stores-adapters/prisma-subscription.adapter";
import { TenantSubsCriptionStatus } from "@/prisma/generated/client";

export class CrudSubscriptionUseCase {
  private subscriptionRepository: SubscriptionRepository;

  constructor() {
    this.subscriptionRepository = new PrismaSubscriptionAdapter();
  }

  async executeCreate(data: CreateSubscriptionDTO) {
    return this.subscriptionRepository.create(data);
  }

  async executeFindAll() {
    return this.subscriptionRepository.findAll();
  }

  async executeFindByTenantId(tenantId: string) {
    return this.subscriptionRepository.findByTenantId(tenantId);
  }

  async executeUpdateStatus(id: string, status: TenantSubsCriptionStatus) {
    return this.subscriptionRepository.updateStatus(id, status);
  }

  async executeDelete(id: string) {
    return this.subscriptionRepository.delete(id);
  }
}
