import { ConfigRepository } from "../../../domain/tenant/repositories/ConfigRepository";
import { TenantConfig } from "../../../types/tenant/type.tenantConfig";
import { BranchConfig } from "../../../types/branch/type.branchConfig";
import { DEFAULT_TENANT_CONFIG } from "@/src/lib/tenant-defaults";
import prisma from "@/src/lib/prisma";

export class PrismaConfigAdapter implements ConfigRepository {
  private prisma = prisma;

  // --- Tenant Config ---
  async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    const config = await this.prisma.tenantConfig.findUnique({
      where: { tenantId },
    });

    if (!config) return null;

    return {
      tenantId,
      ...(config.config as any),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    } as TenantConfig;
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

    return {
      tenantId,
      ...DEFAULT_TENANT_CONFIG,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TenantConfig;
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

    const { tenantId: _, createdAt: __, ...cleanUpdates } = updates;
    const {
      tenantId: ___,
      createdAt: ____,
      ...existingConfig
    } = existing;

    await this.prisma.tenantConfig.update({
      where: { tenantId },
      data: {
        config: {
          ...DEFAULT_TENANT_CONFIG,
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
      ...config,
      openHours: config.openHours as any,
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
          openHours: updates.openHours as any || { open: "09:00", close: "18:00" },
          daysInLaundry: updates.daysInLaundry ?? 2,
          daysInMaintenance: updates.daysInMaintenance ?? 1,
        },
      });
      return;
    }

    await this.prisma.branchConfig.update({
      where: { id: existing.id },
      data: {
        openHours: updates.openHours as any,
        daysInLaundry: updates.daysInLaundry,
        daysInMaintenance: updates.daysInMaintenance,
      },
    });
  }
}
