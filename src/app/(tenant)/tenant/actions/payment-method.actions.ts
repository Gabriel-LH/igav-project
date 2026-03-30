"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { PrismaPaymentMethodCatalogRepository } from "@/src/infrastructure/tenant/repositories/PrismaPaymentMethodCatalogRepository";
import { GetAvailablePaymentMethodsUseCase } from "@/src/application/tenant/use-cases/payment-method/getAvailablePaymentMethods.usecase";
import { CreatePaymentMethodUseCase } from "@/src/application/tenant/use-cases/payment-method/createPaymentMethod.usecase";
import { UpdatePaymentMethodUseCase } from "@/src/application/tenant/use-cases/payment-method/updatePaymentMethod.usecase";
import { DeletePaymentMethodUseCase } from "@/src/application/tenant/use-cases/payment-method/deletePaymentMethod.usecase";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";
import { revalidatePath } from "next/cache";

/**
 * Solo métodos activos para el POS / Checkout.
 */
export async function getAvailablePaymentMethodsAction() {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID no encontrado");

    const repo = new PrismaPaymentMethodCatalogRepository(prisma);
    const useCase = new GetAvailablePaymentMethodsUseCase(repo);
    const paymentMethods = await useCase.execute(tenantId, { onlyActive: true });

    return { success: true, data: paymentMethods };
  } catch (error: any) {
    console.error("Error al obtener métodos de pago activos:", error);
    return { success: false, error: error?.message || "Error al obtener métodos activos" };
  }
}

/**
 * Todos los métodos para la vista de configuración (gestión).
 */
export async function getTenantPaymentMethodsAction() {
  try {
    const { tenantId } = await requireTenantMembership();
    const repo = new PrismaPaymentMethodCatalogRepository(prisma);
    const useCase = new GetAvailablePaymentMethodsUseCase(repo);
    const paymentMethods = await useCase.execute(tenantId, { onlyActive: false });
    return { success: true, data: paymentMethods };
  } catch (error: any) {
    console.error("Error al obtener todos los métodos de pago:", error);
    return { success: false, error: error?.message || "Error al obtener todos los métodos" };
  }
}

export async function createPaymentMethodAction(data: Omit<PaymentMethod, "id">) {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID no encontrado");

    const repo = new PrismaPaymentMethodCatalogRepository(prisma);
    const useCase = new CreatePaymentMethodUseCase(repo);
    const result = await useCase.execute(tenantId, data);

    revalidatePath("/tenant/settings");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error al crear método de pago:", error);
    return { success: false, error: "No se pudo crear el método de pago" };
  }
}

export async function updatePaymentMethodAction(id: string, data: Partial<PaymentMethod>) {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID no encontrado");

    const repo = new PrismaPaymentMethodCatalogRepository(prisma);
    const useCase = new UpdatePaymentMethodUseCase(repo);
    const result = await useCase.execute(id, data);

    revalidatePath("/tenant/settings");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error al actualizar método de pago:", error);
    return { success: false, error: "No se pudo actualizar el método de pago" };
  }
}

export async function deletePaymentMethodAction(id: string) {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID no encontrado");

    const repo = new PrismaPaymentMethodCatalogRepository(prisma);
    const useCase = new DeletePaymentMethodUseCase(repo);
    await useCase.execute(id);

    revalidatePath("/tenant/settings");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar método de pago:", error);
    return { success: false, error: "No se pudo eliminar el método de pago" };
  }
}
