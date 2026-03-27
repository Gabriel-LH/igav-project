"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { revalidatePath } from "next/cache";
import { PrismaReservationRepository } from "@/src/infrastructure/tenant/repositories/PrismaReservationRepository";
import { PrismaInventoryRepository } from "@/src/infrastructure/tenant/repositories/PrismaInventoryRepository";
import { PrismaGuaranteeRepository } from "@/src/infrastructure/tenant/repositories/PrismaGuaranteeRepository";
import { PrismaRentalRepository } from "@/src/infrastructure/tenant/repositories/PrismaRentalRepository";
import { PrismaPaymentRepository } from "@/src/infrastructure/tenant/repositories/PrismaPaymentRepository";
import { PrismaOperationRepository } from "@/src/infrastructure/tenant/repositories/PrismaOperationRepository";
import { ConvertReservationUseCase, ConvertReservationInput } from "@/src/application/tenant/use-cases/reservation/convertReservation.usecase";
import { CancelReservationUseCase } from "@/src/application/tenant/use-cases/reservation/cancelReservation.usecase";
import { makeServerProcessTransaction } from "@/src/infrastructure/tenant/factories/serverProcessTransaction.factory";
import { PrismaConfigAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-config.adapter";
import { PrismaPolicyAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-policy.adapter";
import { ResolveTenantSettingsUseCase } from "@/src/application/tenant/use-cases/settings/resolveTenantSettings.usecase";

export async function convertReservationAction(input: ConvertReservationInput) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId, user } = membership;

    if (!tenantId) throw new Error("Tenant ID es obligatorio");
    if (!user?.id) throw new Error("User ID es obligatorio");

    const configRepo = new PrismaConfigAdapter();
    const policyRepo = new PrismaPolicyAdapter();
    const settingsUC = new ResolveTenantSettingsUseCase(configRepo, policyRepo);
    const { config, policy, branchConfig, configVersion, policyVersion } =
      await settingsUC.execute(tenantId, user.id as string, input.reservation.branchId);

    const result = await prisma.$transaction(async (tx) => {
      const reservationRepo = new PrismaReservationRepository(tx);
      const inventoryRepo = new PrismaInventoryRepository(tx);
      const guaranteeRepo = new PrismaGuaranteeRepository(tx);
      const rentalRepo = new PrismaRentalRepository(tx);

      const processTransactionUC = makeServerProcessTransaction(tx);

      const convertUseCase = new ConvertReservationUseCase(
        reservationRepo,
        inventoryRepo,
        guaranteeRepo,
        rentalRepo,
        processTransactionUC,
      );

      return await convertUseCase.execute({
        ...input,
        tenantId,
        sellerId: user.id as string,
        configSnapshot: {
          tenant: config,
          branch: branchConfig,
        },
        policySnapshot: policy,
        configVersion,
        policyVersion,
      });
    });

    revalidatePath("/tenant/home");
    revalidatePath("/tenant/calendar");
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Error al convertir reserva:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al convertir reserva",
    };
  }
}

export async function cancelReservationAction(reservationId: string, reason: string) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId, user } = membership;

    if (!tenantId) throw new Error("Tenant ID es obligatorio");
    if (!user?.id) throw new Error("User ID es obligatorio");

    const result = await prisma.$transaction(async (tx) => {
      const reservationRepo = new PrismaReservationRepository(tx);
      const paymentRepo = new PrismaPaymentRepository(tx);
      const operationRepo = new PrismaOperationRepository(tx);

      const cancelUseCase = new CancelReservationUseCase(
        reservationRepo,
        paymentRepo,
        operationRepo,
      );

    const userId = user.id as string;
    return await cancelUseCase.execute(reservationId, reason, userId);
  });

  revalidatePath("/tenant/home");
  revalidatePath("/tenant/calendar");

  return { success: true, data: result };
} catch (error) {
  console.error("Error al cancelar reserva:", error);
  return {
    success: false,
    error: error instanceof Error ? error.message : "Error desconocido al cancelar reserva",
  };
}
}

export async function rescheduleReservationAction(reservationId: string, startDate: Date, endDate: Date) {
try {
  const membership = await requireTenantMembership();
  const { tenantId } = membership;

  if (!tenantId) throw new Error("Tenant ID es obligatorio");

  // rearrangereservation ya existe en el dominio pero falta implementarlo en PrismaRepository si no está
  // Por ahora usemos una actualización directa vía prisma
  await prisma.reservation.update({
      where: { id: reservationId },
      data: { startDate, endDate }
  });

  revalidatePath("/tenant/home");
  revalidatePath("/tenant/calendar");

  return { success: true };
} catch (error) {
  console.error("Error al reprogramar reserva:", error);
  return {
    success: false,
    error: error instanceof Error ? error.message : "Error desconocido al reprogramar reserva",
  };
}
}
