import { ConfigRepository } from "@/src/domain/tenant/repositories/ConfigRepository";
import { PolicyRepository } from "@/src/domain/tenant/repositories/PolicyRepository";
import { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import { BranchConfig } from "@/src/types/branch/type.branchConfig";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import {
  DEFAULT_TENANT_CONFIG,
  DEFAULT_TENANT_POLICY_SECTIONS,
} from "@/src/lib/tenant-defaults";

type ResolveTenantSettingsResult = {
  config: TenantConfig;
  policy: TenantPolicy;
  branchConfig: BranchConfig | null;
  configVersion: Date | undefined;
  policyVersion: number | undefined;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const deepMerge = <T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>,
): T => {
  const output: Record<string, unknown> = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    if (value === undefined) return;
    const current = output[key];
    if (isPlainObject(current) && isPlainObject(value)) {
      output[key] = deepMerge(current, value);
    } else {
      output[key] = value;
    }
  });
  return output as T;
};

export class ResolveTenantSettingsUseCase {
  constructor(
    private readonly configRepo: ConfigRepository,
    private readonly policyRepo: PolicyRepository,
  ) {}

  async execute(
    tenantId: string,
    userId?: string,
    branchId?: string,
  ): Promise<ResolveTenantSettingsResult> {
    const config =
      this.configRepo.getOrCreateTenantConfig
        ? await this.configRepo.getOrCreateTenantConfig(tenantId)
        : await this.configRepo.getTenantConfig(tenantId);

    const policy =
      this.policyRepo.getOrCreateActivePolicy
        ? await this.policyRepo.getOrCreateActivePolicy(tenantId, userId)
        : await this.policyRepo.getActivePolicy(tenantId);

    const effectiveConfig = deepMerge(
      DEFAULT_TENANT_CONFIG as unknown as Record<string, unknown>,
      (config ?? {}) as Partial<Record<string, unknown>>,
    ) as Omit<TenantConfig, "tenantId" | "createdAt" | "updatedAt">;

    const effectivePolicySections = deepMerge(
      DEFAULT_TENANT_POLICY_SECTIONS as unknown as Record<string, unknown>,
      (policy ?? {}) as Partial<Record<string, unknown>>,
    ) as Omit<
      TenantPolicy,
      "id" | "tenantId" | "version" | "isActive" | "createdAt" | "updatedBy" | "changeReason"
    >;

    const branchConfig = branchId
      ? await this.configRepo.getBranchConfig(branchId)
      : null;

    const effectiveTenantConfig: TenantConfig = {
      tenantId,
      ...(effectiveConfig as TenantConfig),
      createdAt: config?.createdAt ?? new Date(),
      updatedAt: config?.updatedAt,
    };

    const effectiveTenantPolicy: TenantPolicy = {
      id: policy?.id ?? crypto.randomUUID(),
      tenantId,
      version: policy?.version ?? 1,
      isActive: policy?.isActive ?? true,
      createdAt: policy?.createdAt ?? new Date(),
      updatedBy: policy?.updatedBy ?? userId ?? "system",
      changeReason: policy?.changeReason,
      ...(effectivePolicySections as Omit<
        TenantPolicy,
        "id" | "tenantId" | "version" | "isActive" | "createdAt" | "updatedBy" | "changeReason"
      >),
    };

    return {
      config: effectiveTenantConfig,
      policy: effectiveTenantPolicy,
      branchConfig,
      configVersion: effectiveTenantConfig.updatedAt ?? effectiveTenantConfig.createdAt,
      policyVersion: effectiveTenantPolicy.version,
    };
  }
}
