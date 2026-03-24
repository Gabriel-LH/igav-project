import { TenantConfig } from "../../../types/tenant/type.tenantConfig";
import { BranchConfig } from "../../../types/branch/type.branchConfig";

export interface ConfigRepository {
  // Tenant Config
  getTenantConfig(tenantId: string): Promise<TenantConfig | null>;
  updateTenantConfig(tenantId: string, config: Partial<TenantConfig>): Promise<void>;

  // Branch Config
  getBranchConfig(branchId: string): Promise<BranchConfig | null>;
  updateBranchConfig(branchId: string, config: Partial<BranchConfig>): Promise<void>;
}
