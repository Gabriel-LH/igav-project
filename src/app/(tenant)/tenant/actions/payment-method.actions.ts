"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { PrismaPaymentMethodCatalogRepository } from "@/src/infrastructure/tenant/repositories/PrismaPaymentMethodCatalogRepository";
import { GetAvailablePaymentMethodsUseCase } from "@/src/application/tenant/use-cases/payment-method/getAvailablePaymentMethods.usecase";

export async function getAvailablePaymentMethodsAction() {
  try {
    const membership = await requireTenantMembership();
    const { tenantId } = membership;

    if (!tenantId) {
      throw new Error("Tenant ID es obligatorio");
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { tenantConfig: true },
    });

    const paymentMethodRepo = new PrismaPaymentMethodCatalogRepository(prisma);
    const useCase = new GetAvailablePaymentMethodsUseCase(paymentMethodRepo);
    const paymentMethods = await useCase.execute(tenant?.tenantConfig);

    return { success: true, data: paymentMethods };
  } catch (error) {
    console.error("Error al obtener métodos de pago:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudieron obtener los métodos de pago",
    };
  }
}
