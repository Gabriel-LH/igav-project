"use server";

import prisma from "@/src/lib/prisma";
import { makeServerProcessTransaction } from "@/src/infrastructure/tenant/factories/serverProcessTransaction.factory";
import { revalidatePath } from "next/cache";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { ApplyBundleUseCase } from "@/src/application/tenant/use-cases/applyBundle.usecase";
import { PrismaInventoryRepository } from "@/src/infrastructure/tenant/repositories/PrismaInventoryRepository";
import { PrismaPromotionRepository } from "@/src/infrastructure/tenant/repositories/PrismaPromotionRepository";
import { resolvePaymentMethodId } from "./_utils/resolve-payment-method-id";
import { PrismaConfigAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-config.adapter";
import { PrismaPolicyAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-policy.adapter";
import { ResolveTenantSettingsUseCase } from "@/src/application/tenant/use-cases/settings/resolveTenantSettings.usecase";

/**
 * Server Action to process any transaction (Rental, Sale, Reservation)
 * using the ProcessTransactionUseCase orchestrator.
 */
export async function processTransactionAction(dto: any) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    const userId = membership.user?.id;

    if (!tenantId) {
      throw new Error("Tenant ID es obligatorio");
    }
    if (!userId) {
      throw new Error("User ID es obligatorio");
    }

    const rawPaymentMethod =
      (dto as {
        financials?: { paymentMethod?: unknown; paymentMethodId?: unknown };
      })?.financials?.paymentMethodId ??
      (dto as { financials?: { paymentMethod?: unknown } })?.financials
        ?.paymentMethod ??
      null;
    const rawCreditPaymentMethod =
      (dto as { financials?: { creditPaymentMethodId?: unknown } })?.financials
        ?.creditPaymentMethodId ?? null;
    const rawCreditAppliedAmount = Number(
      (dto as { financials?: { creditAppliedAmount?: unknown } })?.financials
        ?.creditAppliedAmount ?? 0,
    );

    const resolvedPaymentMethodId = rawPaymentMethod
      ? await resolvePaymentMethodId(rawPaymentMethod)
      : null;
    const resolvedCreditPaymentMethodId =
      rawCreditAppliedAmount > 0 && rawCreditPaymentMethod
        ? await resolvePaymentMethodId(rawCreditPaymentMethod)
        : null;

    if (!resolvedPaymentMethodId && !resolvedCreditPaymentMethodId) {
      throw new Error("Metodo de pago invalido");
    }

    const configRepo = new PrismaConfigAdapter();
    const policyRepo = new PrismaPolicyAdapter();
    const settingsUC = new ResolveTenantSettingsUseCase(configRepo, policyRepo);
    const { config, policy, branchConfig, configVersion, policyVersion } =
      await settingsUC.execute(tenantId, userId, dto?.branchId);

    const dtoWithTenant = {
      ...dto,
      tenantId,
      sellerId: userId,
      financials: {
        ...(dto as { financials?: Record<string, unknown> }).financials,
        paymentMethodId: resolvedPaymentMethodId ?? undefined,
        paymentMethod: resolvedPaymentMethodId ?? undefined,
        creditPaymentMethodId: resolvedCreditPaymentMethodId ?? undefined,
      },
      configSnapshot: {
        tenant: config,
        branch: branchConfig,
      },
      policySnapshot: policy,
      configVersion,
      policyVersion,
    };

    const result = await prisma.$transaction(async (tx) => {
      const useCase = makeServerProcessTransaction(tx);
      return await useCase.execute(dtoWithTenant);
    });

    revalidatePath("/tenant/rentals");
    revalidatePath("/tenant/sales");
    revalidatePath("/tenant/reservations");
    revalidatePath("/tenant/home");
    revalidatePath("/tenant/pos");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[processTransactionAction] Error:", error);
    return {
      success: false,
      error:
        (error as Error).message || "Error interno al procesar la transaccion",
    };
  }
}

/**
 * Server Action to reserve items part of a bundle.
 */
export async function reserveBundlesAction(
  items: any[],
  tenantId: string,
  branchId: string,
  startDate: Date,
  endDate: Date,
) {
  try {
    const membership = await requireTenantMembership();
    if (membership.tenantId !== tenantId) {
      throw new Error("Acceso denegado: El tenant no coincide");
    }

    await prisma.$transaction(async (tx) => {
      const inventoryRepo = new PrismaInventoryRepository(tx);
      const promotionRepo = new PrismaPromotionRepository(tx);
      const useCase = new ApplyBundleUseCase(inventoryRepo, promotionRepo);

      await useCase.reserveBundledItems(
        items,
        tenantId,
        branchId,
        startDate,
        endDate,
      );
    });

    return { success: true };
  } catch (error) {
    console.error("[reserveBundlesAction] Error:", error);
    return {
      success: false,
      error: (error as Error).message || "Error al reservar los bultos",
    };
  }
}
