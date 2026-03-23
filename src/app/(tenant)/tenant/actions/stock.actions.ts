"use server";

import { PrismaStockAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-stock.adapter";
import { AssignStockUseCase, AssignStockInput } from "@/src/application/tenant/use-cases/inventory/assignStock.usecase";
import { AssignSerializedItemsUseCase, AssignSerializedItemsInput } from "@/src/application/tenant/use-cases/inventory/assignSerializedItems.usecase";
import { ListReceivePendingUseCase, ListReceivePendingInput } from "@/src/application/tenant/use-cases/inventory/listReceivePending.usecase";
import { MarkReceiveAvailableUseCase, MarkReceiveAvailableInput } from "@/src/application/tenant/use-cases/inventory/markReceiveAvailable.usecase";
import { ReceiveStockQuantityUseCase, ReceiveStockQuantityInput } from "@/src/application/tenant/use-cases/inventory/receiveStockQuantity.usecase";
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

export async function listReceivePendingAction(
  input: Omit<ListReceivePendingInput, "tenantId">,
) {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const stockRepo = new PrismaStockAdapter();
    const useCase = new ListReceivePendingUseCase(stockRepo);

    const result = await useCase.execute({
      ...input,
      tenantId,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al listar pendientes de recepción:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al listar pendientes de recepción",
    };
  }
}

export async function markReceiveAvailableAction(
  input: Omit<MarkReceiveAvailableInput, "tenantId">,
) {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const stockRepo = new PrismaStockAdapter();
    const useCase = new MarkReceiveAvailableUseCase(stockRepo);

    const result = await useCase.execute({
      ...input,
      tenantId,
    });

    revalidatePath("/tenant/inventory/receive");
    revalidatePath("/tenant/inventory/stock");
    revalidatePath("/tenant/inventory/items");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al marcar recepción disponible:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al marcar recepción disponible",
    };
  }
}

export async function receiveStockQuantityAction(
  input: Omit<ReceiveStockQuantityInput, "tenantId">,
) {
  try {
    const { tenantId, user } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const stockRepo = new PrismaStockAdapter();
    const useCase = new ReceiveStockQuantityUseCase(stockRepo);

    const result = await useCase.execute({
      ...input,
      tenantId,
      changedBy: user.id!,
    });

    revalidatePath("/tenant/inventory/receive");
    revalidatePath("/tenant/inventory/stock");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al recibir stock:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al recibir stock",
    };
  }
}

export async function deleteStockLotAction(id: string) {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const stockRepo = new PrismaStockAdapter();
    // Verify it belongs to this tenant before deleting
    const lot = await stockRepo.getLotById(id);
    if (!lot || lot.tenantId !== tenantId) {
      throw new Error("Lote no encontrado o sin permisos");
    }

    await stockRepo.deleteStockLot(id);

    revalidatePath("/tenant/inventory/inventory/stock");
    revalidatePath("/tenant/inventory/inventory/products");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar lote de stock:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar lote",
    };
  }
}

export async function deleteInventoryItemAction(id: string) {
  try {
    const { tenantId } = await requireTenantMembership();
    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const stockRepo = new PrismaStockAdapter();
    await stockRepo.deleteInventoryItem(id);

    revalidatePath("/tenant/inventory/inventory/serialized-items");
    revalidatePath("/tenant/inventory/inventory/products");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar item serializado:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar item serializado",
    };
  }
}
