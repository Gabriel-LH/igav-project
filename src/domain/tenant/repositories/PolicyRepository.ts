import { TenantPolicy } from "../../../types/tenant/type.tenantPolicy";

export interface PolicyRepository {
  upsertPolicy(policy: TenantPolicy): Promise<void>;
  getActivePolicy(tenantId: string): Promise<TenantPolicy | null>;
  getPolicyByVersion(tenantId: string, version: number): Promise<TenantPolicy | null>;
  getHistory(tenantId: string): Promise<TenantPolicy[]>;
}
