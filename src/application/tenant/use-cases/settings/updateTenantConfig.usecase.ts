import { TenantConfig } from "../../../../types/tenant/type.tenantConfig";
import { ConfigRepository } from "../../../../domain/tenant/repositories/ConfigRepository";

export class UpdateTenantConfigUseCase {
  constructor(private configRepository: ConfigRepository) {}

  async execute(tenantId: string, updates: Partial<TenantConfig>): Promise<void> {
    await this.configRepository.updateTenantConfig(tenantId, updates);
  }
}
