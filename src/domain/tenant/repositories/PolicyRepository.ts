import { TenantPolicy } from "../../../types/tenant/type.tenantPolicy";

export interface PolicyRepository {
  upsertPolicy(policy: TenantPolicy): Promise<void>;
  getActivePolicy(tenantId: string): Promise<TenantPolicy | null>;
  getOrCreateActivePolicy?(tenantId: string, userId?: string): Promise<TenantPolicy>;
  getPolicyByVersion(tenantId: string, version: number): Promise<TenantPolicy | null>;
  getHistory(tenantId: string): Promise<TenantPolicy[]>;
}
