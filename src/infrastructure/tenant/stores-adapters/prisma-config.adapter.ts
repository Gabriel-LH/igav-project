import { ConfigRepository } from "../../../domain/tenant/repositories/ConfigRepository";
import { TenantConfig } from "../../../types/tenant/type.tenantConfig";
import { BranchConfig } from "../../../types/branch/type.branchConfig";
import { DEFAULT_TENANT_CONFIG, DEFAULT_BRANCH_CONFIG } from "@/src/lib/tenant-defaults";
import prisma from "@/src/lib/prisma";

export class PrismaConfigAdapter implements ConfigRepository {
  private prisma = prisma;

  private normalizeTenantConfig(
    tenantId: string,
    config: Record<string, unknown>,
    createdAt: Date,
    updatedAt?: Date | null,
  ): TenantConfig {
    const raw = config as Partial<TenantConfig>;

    return {
      tenantId,
      ...DEFAULT_TENANT_CONFIG,
      ...raw,
      tax: {
        ...DEFAULT_TENANT_CONFIG.tax,
        ...(raw.tax ?? {}),
        rounding: {
          ...DEFAULT_TENANT_CONFIG.tax.rounding,
          ...(raw.tax?.rounding ?? {}),
        },
      },
      pricing: {
        ...DEFAULT_TENANT_CONFIG.pricing,
        ...(raw.pricing ?? {}),
      },
      loyalty: {
        ...DEFAULT_TENANT_CONFIG.loyalty,
        ...(raw.loyalty ?? {}),
      },
      cash: {
        ...DEFAULT_TENANT_CONFIG.cash,
        ...(raw.cash ?? {}),
      },
      referrals: {
        ...DEFAULT_TENANT_CONFIG.referrals,
        ...(raw.referrals ?? {}),
      },
      createdAt,
      updatedAt: updatedAt ?? undefined,
    } as TenantConfig;
  }

  // --- Tenant Config ---
  async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    const config = await this.prisma.tenantConfig.findUnique({
      where: { tenantId },
    });

    if (!config) return null;

    return this.normalizeTenantConfig(
      tenantId,
      (config.config as Record<string, unknown>) ?? {},
      config.createdAt,
      config.updatedAt,
    );
  }

  async getOrCreateTenantConfig(tenantId: string): Promise<TenantConfig> {
    const existing = await this.getTenantConfig(tenantId);
    if (existing) {
      return existing;
    }

    await this.prisma.tenantConfig.create({
      data: {
        tenantId,
        config: DEFAULT_TENANT_CONFIG as any,
      },
    });

    return this.normalizeTenantConfig(
      tenantId,
      DEFAULT_TENANT_CONFIG as unknown as Record<string, unknown>,
      new Date(),
      new Date(),
    );
  }

  async updateTenantConfig(
    tenantId: string,
    updates: Partial<TenantConfig>,
  ): Promise<void> {
    const existing = await this.getTenantConfig(tenantId);
    
    // Si no existe, crear uno nuevo
    if (!existing) {
        await this.prisma.tenantConfig.create({
            data: {
                tenantId,
                config: {
                  ...DEFAULT_TENANT_CONFIG,
                  ...updates,
                } as any,
            }
        });
        return;
    }

    const { tenantId: _, createdAt: __, ...cleanUpdates } = updates as TenantConfig & {
      discounts?: unknown;
    };
    const {
      tenantId: ___,
      createdAt: ____,
      discounts: _____,
      ...existingConfig
    } = existing as TenantConfig & { discounts?: unknown };

    await this.prisma.tenantConfig.update({
      where: { tenantId },
      data: {
        config: {
          ...existingConfig,
          ...cleanUpdates,
        },
      },
    });
  }

  // --- Branch Config ---
  async getBranchConfig(branchId: string): Promise<BranchConfig | null> {
    const config = await this.prisma.branchConfig.findFirst({
      where: { branchId },
    });

    if (!config) return null;

    return {
      ...DEFAULT_BRANCH_CONFIG,
      ...config,
      openHours: (config.openHours as any) || DEFAULT_BRANCH_CONFIG.openHours,
    } as BranchConfig;
  }

  async updateBranchConfig(
    branchId: string,
    updates: Partial<BranchConfig>,
  ): Promise<void> {
    const existing = await this.prisma.branchConfig.findFirst({
      where: { branchId },
    });

    if (!existing) {
      await this.prisma.branchConfig.create({
        data: {
          branchId,
          openHours: (updates.openHours as any) || DEFAULT_BRANCH_CONFIG.openHours,
          daysInLaundry: updates.daysInLaundry ?? DEFAULT_BRANCH_CONFIG.daysInLaundry,
          daysInMaintenance: updates.daysInMaintenance ?? DEFAULT_BRANCH_CONFIG.daysInMaintenance,
        } as any,
      });
      return;
    }

    await this.prisma.branchConfig.update({
      where: { id: existing.id },
      data: {
        openHours: updates.openHours as any,
        daysInLaundry: updates.daysInLaundry,
        daysInMaintenance: updates.daysInMaintenance,
      } as any,
    });
  }
}
