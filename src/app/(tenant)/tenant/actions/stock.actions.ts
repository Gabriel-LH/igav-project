"use server";

import { PrismaStockAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-stock.adapter";
import { AssignStockUseCase, AssignStockInput } from "@/src/application/tenant/use-cases/inventory/assignStock.usecase";
import { AssignSerializedItemsUseCase, AssignSerializedItemsInput } from "@/src/application/tenant/use-cases/inventory/assignSerializedItems.usecase";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { revalidatePath } from "next/cache";

/**
 * Acciones para la gestión de stock e inventario.
 */

export async function assignStockAction(input: Omit<AssignStockInput, "tenantId">) {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const stockRepo = new PrismaStockAdapter();
    const useCase = new AssignStockUseCase(stockRepo);

    const result = await useCase.execute({
      ...input,
      tenantId,
    });

    revalidatePath("/tenant/inventory/inventory/products");
    revalidatePath("/tenant/inventory/inventory/stock");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error al asignar stock:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al asignar stock",
    };
  }
}

export async function assignSerializedAction(input: Omit<AssignSerializedItemsInput, "tenantId">) {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const stockRepo = new PrismaStockAdapter();
    const useCase = new AssignSerializedItemsUseCase(stockRepo);

    const result = await useCase.execute({
      ...input,
      tenantId,
    });

    revalidatePath("/tenant/inventory/inventory/products");
    revalidatePath("/tenant/inventory/inventory/serialized-items");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error al asignar items serializados:", error);
    return {
      success: false,
    };
  }
}

export async function listStockLotsAction() {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const stockRepo = new PrismaStockAdapter();
    const lots = await stockRepo.getLotsByTenant(tenantId);

    return { success: true, data: lots };
  } catch (error) {
    console.error("Error al listar lotes de stock:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al listar lotes de stock",
    };
  }
}

export async function listSerializedItemsAction() {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const stockRepo = new PrismaStockAdapter();
    const items = await stockRepo.getItemsByTenant(tenantId);

    return { success: true, data: items };
  } catch (error) {
    console.error("Error al listar items serializados:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al listar items serializados",
    };
  }
}
