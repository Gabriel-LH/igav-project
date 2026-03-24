"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { revalidatePath } from "next/cache";
import { PrismaOperationRepository } from "@/src/infrastructure/tenant/repositories/PrismaOperationRepository";
import { PrismaPaymentRepository } from "@/src/infrastructure/tenant/repositories/PrismaPaymentRepository";
import { PrismaSaleRepository } from "@/src/infrastructure/tenant/repositories/PrismaSaleRepository";
import { PrismaRentalRepository } from "@/src/infrastructure/tenant/repositories/PrismaRentalRepository";
import { PrismaClientCreditRepository } from "@/src/infrastructure/tenant/repositories/PrismaClientCreditRepository";
import { PrismaLoyaltyRepository } from "@/src/infrastructure/tenant/repositories/PrismaLoyaltyRepository";
import { RegisterPaymentUseCase, RegisterPaymentInput } from "@/src/application/tenant/use-cases/registerPayment.usecase";
import { AddClientCreditUseCase } from "@/src/application/tenant/use-cases/client/addClientCredit.usecase";
import { RewardLoyaltyUseCase } from "@/src/application/tenant/use-cases/rewardLoyalty.usecase";
import { resolvePaymentMethodId } from "./_utils/resolve-payment-method-id";

export async function registerPaymentAction(input: RegisterPaymentInput) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId } = membership;

    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const resolvedPaymentMethodId =
      await resolvePaymentMethodId(input.method);

    if (!resolvedPaymentMethodId) {
      throw new Error("Método de pago inválido");
    }

    const result = await prisma.$transaction(async (tx) => {
      const operationRepo = new PrismaOperationRepository(tx);
      const paymentRepo = new PrismaPaymentRepository(tx);
      const saleRepo = new PrismaSaleRepository(tx);
      const rentalRepo = new PrismaRentalRepository(tx);
      const clientCreditRepo = new PrismaClientCreditRepository(tx);
      const loyaltyRepo = new PrismaLoyaltyRepository(tx);

      const addClientCreditUC = new AddClientCreditUseCase(clientCreditRepo);
      const rewardLoyaltyUC = new RewardLoyaltyUseCase(loyaltyRepo);

      const registerPaymentUC = new RegisterPaymentUseCase(
        operationRepo,
        paymentRepo,
        saleRepo,
        rentalRepo,
        addClientCreditUC,
        rewardLoyaltyUC,
      );

      return await registerPaymentUC.execute({
        ...input,
        method: resolvedPaymentMethodId,
      } as RegisterPaymentInput);
    });

    revalidatePath("/tenant/home");
    revalidatePath("/tenant/calendar");

    return { success: true, data: JSON.parse(JSON.stringify(result)) }; // Ensure plain object for transition
  } catch (error) {
    console.error("Error al registrar pago:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al registrar pago",
    };
  }
}
