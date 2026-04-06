"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, TransferPriority } from "@/prisma/generated/client";
import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";

type CreateTransferItemInput = {
  id: string;
  stockId?: string;
  itemId?: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  variantCode: string;
  isSerial: boolean;
  serialCode?: string;
  quantity: number;
  barcode: string;
  condition: string;
  fromBranchId: string;
};

export type CreateTransferActionInput = {
  fromBranchId: string;
  toBranchId: string;
  referenceNumber: string;
  notes: string;
  scheduledDate: string;
  items: CreateTransferItemInput[];
  priority: TransferPriority;
  requiresApproval: boolean;
};

type TransferDispatchItem = {
  itemId?: string;
  stockId?: string;
  quantity: number;
  productId: string;
  variantId: string;
  isSerial: boolean;
};

type TransferMetadata = {
  dispatchItems: TransferDispatchItem[];
};

type TransferView = {
  id: string;
  referenceNumber: string;
  fromBranchId: string;
  toBranchId: string;
  fromBranchName: string;
  toBranchName: string;
  fromBranchAddress: string;
  toBranchAddress: string;
  status: "pendiente" | "en_transito" | "completada" | "cancelada";
  priority: TransferPriority;
  scheduledDate: string;
  createdAt: Date;
  items: Array<{
    id: string;
    productName: string;
    variantName: string;
    isSerial: boolean;
    serialCode?: string;
    quantity: number;
    condition: string;
  }>;
  totalItems: number;
  serialCount: number;
  notes?: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  dispatchItems: TransferDispatchItem[];
};

function parseTransferMetadata(rawMetadata: Prisma.JsonValue | null): TransferMetadata {
  if (!rawMetadata || typeof rawMetadata !== "object" || Array.isArray(rawMetadata)) {
    return { dispatchItems: [] };
  }

  const metadata = rawMetadata as { dispatchItems?: TransferDispatchItem[] };
  return {
    dispatchItems: Array.isArray(metadata.dispatchItems)
      ? metadata.dispatchItems
      : [],
  };
}

function buildTransferMetadata(
  dispatchItems: TransferDispatchItem[],
): Prisma.InputJsonValue {
  return {
    dispatchItems,
  };
}

function mapTransferStatus(
  status: "draft" | "sent" | "in_transit" | "received" | "canceled",
): TransferView["status"] {
  if (status === "draft") return "pendiente";
  if (status === "canceled") return "cancelada";
  if (status === "received") return "completada";
  return "en_transito";
}

async function moveTransferInventory(params: {
  tx: Omit<
    typeof prisma,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >;
  tenantId: string;
  originBranchId: string;
  destinationBranchId: string;
  dispatchItems: TransferDispatchItem[];
}): Promise<TransferDispatchItem[]> {
  const resolvedDispatchItems: TransferDispatchItem[] = [];

  for (const dispatchItem of params.dispatchItems) {
    if (dispatchItem.isSerial) {
      if (!dispatchItem.itemId) {
        throw new Error("Falta el item serializado para enviar la transferencia.");
      }

      const inventoryItem = await params.tx.inventoryItem.findFirst({
        where: {
          id: dispatchItem.itemId,
          tenantId: params.tenantId,
          branchId: params.originBranchId,
          status: "disponible",
        },
      });

      if (!inventoryItem) {
        throw new Error(
          "Uno de los serializados ya no esta disponible en la sucursal origen.",
        );
      }

      await params.tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          branchId: params.destinationBranchId,
          status: "en_transito",
        },
      });

      resolvedDispatchItems.push({
        ...dispatchItem,
        itemId: inventoryItem.id,
      });
      continue;
    }

    if (!dispatchItem.stockId) {
      throw new Error("Falta el lote a transferir.");
    }

    const stockLot = await params.tx.stockLot.findFirst({
      where: {
        id: dispatchItem.stockId,
        tenantId: params.tenantId,
        branchId: params.originBranchId,
        status: "disponible",
      },
    });

    if (!stockLot) {
      throw new Error(
        "Uno de los lotes ya no esta disponible en la sucursal origen.",
      );
    }

    if (dispatchItem.quantity > stockLot.quantity) {
      throw new Error(
        "La cantidad solicitada supera el stock disponible para uno de los lotes.",
      );
    }

    if (dispatchItem.quantity === stockLot.quantity) {
      await params.tx.stockLot.update({
        where: { id: stockLot.id },
        data: {
          branchId: params.destinationBranchId,
          status: "en_transito",
        },
      });

      resolvedDispatchItems.push({
        ...dispatchItem,
        stockId: stockLot.id,
      });
      continue;
    }

    await params.tx.stockLot.update({
      where: { id: stockLot.id },
      data: {
        quantity: stockLot.quantity - dispatchItem.quantity,
      },
    });

    const transitLotId = crypto.randomUUID();
    await params.tx.stockLot.create({
      data: {
        id: transitLotId,
        tenantId: params.tenantId,
        productId: stockLot.productId,
        variantId: stockLot.variantId,
        branchId: params.destinationBranchId,
        quantity: dispatchItem.quantity,
        barcode: stockLot.barcode,
        expirationDate: stockLot.expirationDate,
        lotNumber: stockLot.lotNumber,
        isForRent: stockLot.isForRent,
        isForSale: stockLot.isForSale,
        status: "en_transito",
        condition: stockLot.condition,
      },
    });

    resolvedDispatchItems.push({
      ...dispatchItem,
      stockId: transitLotId,
    });
  }

  return resolvedDispatchItems;
}

async function mapTransferToView(tenantId: string): Promise<TransferView[]> {
  const transfers = await prisma.transfer.findMany({
    where: { tenantId },
    include: {
      branchOrigin: true,
      branchDestination: true,
      transferItems: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return transfers.map((transfer) => {
    const metadata = parseTransferMetadata(transfer.metadata as Prisma.JsonValue | null);
    const itemViews = transfer.transferItems.map((item, index) => {
      const dispatchItem = metadata.dispatchItems[index];
      return {
        id: item.id,
        productName: item.product.name,
        variantName: item.variant.variantCode,
        isSerial: dispatchItem?.isSerial ?? false,
        quantity: item.quantitySent,
        condition: "Nuevo",
      };
    });

    return {
      id: transfer.id,
      referenceNumber: transfer.referenceNumber,
      fromBranchId: transfer.originBranchId,
      toBranchId: transfer.destinationBranchId,
      fromBranchName: transfer.branchOrigin.name,
      toBranchName: transfer.branchDestination.name,
      fromBranchAddress: transfer.branchOrigin.address,
      toBranchAddress: transfer.branchDestination.address,
      status: mapTransferStatus(transfer.status),
      priority: transfer.priority,
      scheduledDate: transfer.receivedAt.toISOString().split("T")[0],
      createdAt: transfer.createdAt,
      items: itemViews,
      totalItems: itemViews.reduce((sum, item) => sum + item.quantity, 0),
      serialCount: metadata.dispatchItems.filter((item) => item.isSerial).length,
      notes: transfer.notes ?? undefined,
      requiresApproval: transfer.requiresApproval,
      approvedBy: transfer.approvedBy ?? undefined,
      approvedAt: transfer.approvedAt ?? undefined,
      dispatchItems: metadata.dispatchItems,
    };
  });
}

async function syncTransfersForBranch(
  tenantId: string,
  destinationBranchId: string,
) {
  const transfers = await prisma.transfer.findMany({
    where: {
      tenantId,
      destinationBranchId,
      status: "in_transit",
    },
    include: {
      transferItems: true,
    },
  });

  for (const transfer of transfers) {
    const metadata = parseTransferMetadata(transfer.metadata as Prisma.JsonValue | null);
    if (!metadata.dispatchItems.length) continue;

    let isComplete = true;

    for (const dispatchItem of metadata.dispatchItems) {
      if (dispatchItem.isSerial) {
        if (!dispatchItem.itemId) {
          isComplete = false;
          break;
        }

        const item = await prisma.inventoryItem.findUnique({
          where: { id: dispatchItem.itemId },
        });

        if (!item || item.status !== "disponible") {
          isComplete = false;
          break;
        }

        continue;
      }

      if (!dispatchItem.stockId) {
        isComplete = false;
        break;
      }

      const lot = await prisma.stockLot.findUnique({
        where: { id: dispatchItem.stockId },
      });

      if (lot && lot.status !== "disponible") {
        isComplete = false;
        break;
      }
    }

    if (!isComplete) continue;

    await prisma.$transaction(async (tx) => {
      await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: "received",
          receivedAt: new Date(),
        },
      });

      for (const transferItem of transfer.transferItems) {
        await tx.transferItem.update({
          where: { id: transferItem.id },
          data: {
            quantityReceived: transferItem.quantitySent,
          },
        });
      }
    });
  }
}

export async function syncTransfersAfterReceiveAction(destinationBranchId: string) {
  try {
    const membership = await requireTenantMembership();
    if (!membership.tenantId) throw new Error("Tenant ID not found");

    await syncTransfersForBranch(membership.tenantId, destinationBranchId);

    revalidatePath("/tenant/inventory/transfers");
    revalidatePath("/tenant/inventory/receive");

    return { success: true };
  } catch (error) {
    console.error("Error al sincronizar transferencias recibidas:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo sincronizar el estado de las transferencias.",
    };
  }
}

export async function listTransfersAction() {
  try {
    const membership = await requireTenantMembership();
    if (!membership.tenantId) throw new Error("Tenant ID not found");

    const transfers = await mapTransferToView(membership.tenantId);
    return { success: true, data: transfers };
  } catch (error) {
    console.error("Error al listar transferencias:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudieron listar las transferencias.",
    };
  }
}

export async function createTransferAction(input: CreateTransferActionInput) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) throw new Error("Tenant ID not found");

    if (input.fromBranchId === input.toBranchId) {
      throw new Error("La sucursal origen y destino deben ser diferentes.");
    }

    if (!input.items.length) {
      throw new Error("Debes seleccionar al menos un item para transferir.");
    }

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      const pendingDispatchItems = input.items.map((item) => ({
        itemId: item.itemId,
        stockId: item.stockId,
        quantity: item.quantity,
        productId: item.productId,
        variantId: item.variantId,
        isSerial: item.isSerial,
      }));

      const createdTransfer = await tx.transfer.create({
        data: {
          tenantId,
          referenceNumber: input.referenceNumber,
          originBranchId: input.fromBranchId,
          destinationBranchId: input.toBranchId,
          priority: input.priority,
          requiresApproval: input.requiresApproval,
          status: input.requiresApproval ? "draft" : "in_transit",
          sentAt: now,
          receivedAt: new Date(input.scheduledDate),
          notes: input.notes || null,
          metadata: buildTransferMetadata(pendingDispatchItems),
          createdAt: now,
          createdBy: membership.user.id!,
          approvedBy: input.requiresApproval ? null : membership.user.id!,
          approvedAt: input.requiresApproval ? null : now,
          transferItems: {
            create: input.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantitySent: item.quantity,
              quantityReceived: null,
              createdAt: now,
            })),
          },
        },
      });

      if (!input.requiresApproval) {
        const resolvedDispatchItems = await moveTransferInventory({
          tx,
          tenantId,
          originBranchId: input.fromBranchId,
          destinationBranchId: input.toBranchId,
          dispatchItems: pendingDispatchItems,
        });

        await tx.transfer.update({
          where: { id: createdTransfer.id },
          data: {
            status: "in_transit",
            sentAt: now,
            metadata: buildTransferMetadata(resolvedDispatchItems),
          },
        });
      }
    });

    revalidatePath("/tenant/inventory/transfers");
    revalidatePath("/tenant/inventory/receive");

    const transfers = await mapTransferToView(tenantId);
    return { success: true, data: transfers };
  } catch (error) {
    console.error("Error al crear transferencia:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo crear la transferencia.",
    };
  }
}

export async function approveTransferAction(transferId: string) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) throw new Error("Tenant ID not found");

    await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findFirst({
        where: {
          id: transferId,
          tenantId,
          status: "draft",
        },
      });

      if (!transfer) {
        throw new Error("La transferencia no existe o ya no puede aprobarse.");
      }

      const metadata = parseTransferMetadata(transfer.metadata as Prisma.JsonValue | null);
      const resolvedDispatchItems = await moveTransferInventory({
        tx,
        tenantId,
        originBranchId: transfer.originBranchId,
        destinationBranchId: transfer.destinationBranchId,
        dispatchItems: metadata.dispatchItems,
      });

      await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: "in_transit",
          sentAt: new Date(),
          approvedBy: membership.user.id!,
          approvedAt: new Date(),
          metadata: buildTransferMetadata(resolvedDispatchItems),
        },
      });
    });

    revalidatePath("/tenant/inventory/transfers");
    revalidatePath("/tenant/inventory/receive");

    const transfers = await mapTransferToView(tenantId);
    return { success: true, data: transfers };
  } catch (error) {
    console.error("Error al aprobar transferencia:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo aprobar la transferencia.",
    };
  }
}

export async function cancelTransferAction(transferId: string) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) throw new Error("Tenant ID not found");

    const transfer = await prisma.transfer.findFirst({
      where: {
        id: transferId,
        tenantId,
        status: "draft",
      },
    });

    if (!transfer) {
      throw new Error("Solo se pueden cancelar transferencias pendientes.");
    }

    await prisma.transfer.update({
      where: { id: transferId },
      data: {
        status: "canceled",
      },
    });

    revalidatePath("/tenant/inventory/transfers");

    const transfers = await mapTransferToView(tenantId);
    return { success: true, data: transfers };
  } catch (error) {
    console.error("Error al cancelar transferencia:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo cancelar la transferencia.",
    };
  }
}
