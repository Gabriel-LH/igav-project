"use server";

import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { PrismaProductAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-product.adapter";
import { PrismaStockAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-stock.adapter";
import { ListBranchInventoryUseCase } from "@/src/application/tenant/use-cases/inventory/listBranchInventory.usecase";

export async function getBranchInventoryAction(branchId: string) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId } = membership;

    if (!tenantId) throw new Error("Tenant ID es obligatorio");
    if (!branchId) throw new Error("Branch ID es obligatorio");

    const productRepo = new PrismaProductAdapter();
    const stockRepo = new PrismaStockAdapter();
    const listUseCase = new ListBranchInventoryUseCase(productRepo, stockRepo);

    const result = await listUseCase.execute({ tenantId, branchId });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al obtener inventario por sucursal:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener inventario",
    };
  }
}
export async function updateStockStatusAction(input: {
  id: string;
  type: "serial" | "lot";
  status: string;
}) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId } = membership;

    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const stockRepo = new PrismaStockAdapter();

    if (input.type === "serial") {
      await stockRepo.updateInventoryItemStatus(input.id, input.status as any);
    } else {
      await stockRepo.updateStockLotStatus(input.id, input.status as any);
    }

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estado de stock:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al actualizar estado",
    };
  }
}
