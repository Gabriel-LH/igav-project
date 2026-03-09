import {
  TenantRepository,
  CreateTenantDTO,
  UpdateTenantDTO,
} from "@/src/domain/superadmin/repositories/TenantRepository";
import { PrismaTenantAdapter } from "@/src/infrastructure/superadmin/stores-adapters/prisma-tenant.adapter";

export class CrudTenantUseCase {
  private tenantRepository: TenantRepository;

  constructor() {
    this.tenantRepository = new PrismaTenantAdapter();
  }

  async executeCreate(data: CreateTenantDTO) {
    if (!data.name || !data.slug || !data.ownerId) {
      throw new Error("Name, slug and ownerId are required");
    }
    const tenant = await this.tenantRepository.create(data);
    // Provision owner/admin/empleado/cajero roles with their permission sets
    await this.tenantRepository.provisionSystemRoles(tenant.id, data.ownerId);
    return tenant;
  }

  async executeUpdate(id: string, data: UpdateTenantDTO) {
    if (!id) {
      throw new Error("Tenant ID is required");
    }
    return this.tenantRepository.update(id, data);
  }

  async executeFindById(id: string) {
    if (!id) {
      throw new Error("Tenant ID is required");
    }
    return this.tenantRepository.findById(id);
  }

  async executeFindAll() {
    return this.tenantRepository.findAll();
  }

  async executeSuspend(id: string) {
    if (!id) {
      throw new Error("Tenant ID is required");
    }
    return this.tenantRepository.suspend(id);
  }
}
