"use server";

import { PrismaPolicyAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-policy.adapter";
import { PrismaConfigAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-config.adapter";
import { UpsertTenantPolicyUseCase } from "@/src/application/tenant/use-cases/settings/upsertTenantPolicy.usecase";
import { UpdateTenantConfigUseCase } from "@/src/application/tenant/use-cases/settings/updateTenantConfig.usecase";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import { revalidatePath } from "next/cache";

export async function getActivePolicyAction() {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) throw new Error("Tenant ID not found");

    const policyRepo = new PrismaPolicyAdapter();
    const policy = await policyRepo.getOrCreateActivePolicy(
      tenantId,
      membership.user.id as string,
    );

    return { success: true, data: policy };
  } catch (error) {
    console.error("Error al obtener políticas:", error);
    return { success: false, error: "No se pudieron obtener las políticas" };
  }
}

export async function upsertPolicyAction(
  updates: Partial<TenantPolicy>,
  reason?: string,
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    const userId = membership.user.id as string;

    if (!tenantId) throw new Error("Tenant ID not found");

    const policyRepo = new PrismaPolicyAdapter();
    const useCase = new UpsertTenantPolicyUseCase(policyRepo);
    await useCase.execute({ tenantId, userId, updates, changeReason: reason });

    revalidatePath("/tenant/settings");
    return { success: true };
  } catch (error) {
    console.error("Error al guardar políticas:", error);
    return { success: false, error: "No se pudo actualizar la política" };
  }
}

export async function getTenantConfigAction() {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) throw new Error("Tenant ID not found");

    const configRepo = new PrismaConfigAdapter();
    const config = await configRepo.getOrCreateTenantConfig(tenantId);

    return { success: true, data: config };
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return { success: false, error: "No se pudo obtener la configuración" };
  }
}

export async function updateTenantConfigAction(updates: Partial<TenantConfig>) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) throw new Error("Tenant ID not found");

    const configRepo = new PrismaConfigAdapter();
    const useCase = new UpdateTenantConfigUseCase(configRepo);
    await useCase.execute(tenantId, updates);

    revalidatePath("/tenant/settings");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return { success: false, error: "No se pudo actualizar la configuración" };
  }
}
