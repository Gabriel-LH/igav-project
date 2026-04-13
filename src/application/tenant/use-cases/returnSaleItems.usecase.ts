import { SaleRepository } from "../../../domain/tenant/repositories/SaleRepository";
import { SaleReversalRepository } from "../../../domain/tenant/repositories/SaleReversalRepository";
import { InventoryRepository } from "../../../domain/tenant/repositories/InventoryRepository";
import { PaymentRepository } from "../../../domain/tenant/repositories/PaymentRepository";
import { Payment } from "../../../types/payments/type.payments";
import { OperationRepository } from "../../../domain/tenant/repositories/OperationRepository";
import { DEFAULT_TENANT_POLICY_SECTIONS } from "@/src/lib/tenant-defaults";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import { differenceInHours } from "date-fns";
import { SaleItem } from "@/src/types/sales/type.saleItem";

export interface ReturnSaleItemsInput {
  saleId: string;
  reason: string;
  userId: string;
  items: {
    saleItemId: string;
    quantity: number;
    condition?: "perfecto" | "dañado" | "manchado";
    restockingFee: number;
  }[];
}

type PreparedReversalItem = {
  sourceSaleItemId: string;
  saleItemId: string;
  tenantId: string;
  quantity: number;
  originalQuantity: number;
  itemSnapshot: SaleItem;
  condition?: "perfecto" | "dañado" | "manchado";
  restockingFee: number;
  refundedAmount: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function getProratedUnitPaid(
  saleTotalAmount: number,
  allItems: SaleItem[],
  targetItem: SaleItem,
): number {
  const grossTotal = allItems.reduce(
    (sum, item) => sum + Number(item.priceAtMoment || 0) * Number(item.quantity || 0),
    0,
  );

  if (grossTotal <= 0 || targetItem.quantity <= 0) {
    return Number(targetItem.priceAtMoment || 0);
  }

  const lineGross =
    Number(targetItem.priceAtMoment || 0) * Number(targetItem.quantity || 0);
  const lineNetPaid = (Number(saleTotalAmount || 0) * lineGross) / grossTotal;

  return roundMoney(lineNetPaid / Number(targetItem.quantity || 1));
}

export class ReturnSaleItemsUseCase {
  constructor(
    private saleRepo: SaleRepository,
    private reversalRepo: SaleReversalRepository,
    private inventoryRepo: InventoryRepository,
    private paymentRepo: PaymentRepository,
    private operationRepo: OperationRepository,
  ) {}

  async execute({
    saleId,
    items,
    reason,
    userId,
  }: ReturnSaleItemsInput): Promise<void> {
    const sale = await this.saleRepo.getSaleById(saleId);

    if (!sale) throw new Error("Venta no encontrada");
    if (sale.status === "cancelado") {
      throw new Error("No se puede devolver una venta anulada");
    }

    const operation = await this.operationRepo.getOperationById(sale.operationId);
    const policySnapshot = operation?.policySnapshot as TenantPolicy | undefined;
    const policy: TenantPolicy = {
      id: "policy-default",
      tenantId: sale.tenantId,
      version: 1,
      isActive: true,
      createdAt: new Date(0),
      updatedBy: "system",
      ...(DEFAULT_TENANT_POLICY_SECTIONS as TenantPolicy),
      ...(policySnapshot ?? {}),
      sales: {
        ...(DEFAULT_TENANT_POLICY_SECTIONS as TenantPolicy).sales,
        ...(policySnapshot?.sales ?? {}),
      },
    };

    if (!policy.sales?.allowReturns) {
      throw new Error("Las devoluciones están deshabilitadas por política.");
    }

    const maxReturnHours = policy.sales?.maxReturnHours;
    if (maxReturnHours !== undefined) {
      const baseDate = sale.saleDate ?? sale.createdAt;
      const hours = differenceInHours(new Date(), baseDate);
      if (hours > maxReturnHours) {
        throw new Error(
          `La venta excede el plazo máximo de ${maxReturnHours} horas para devolución.`,
        );
      }
    }

    const saleWithItems = await this.saleRepo.getSaleWithItems(saleId);
    const pendingItems = saleWithItems.items.filter((i) => !i.isReturned);

    if (sale.status !== "vendido") {
      const hasLotItems = pendingItems.some((i) => i.stockId);
      if (hasLotItems) {
        throw new Error("No se puede devolver una venta no entregada.");
      }
    }

    if (!policy.sales?.allowPartialReturns) {
      const inputIds = new Set(items.map((i) => i.saleItemId));
      if (pendingItems.length !== items.length) {
        throw new Error("La política requiere devolver todos los items.");
      }
      const allIncluded = pendingItems.every((i) => inputIds.has(i.id));
      if (!allIncluded) {
        throw new Error("La política requiere devolver todos los items.");
      }
    }

    let totalRefunded = 0;
    const originalItems = saleWithItems.items;

    const reversalItems: PreparedReversalItem[] = items.map((input) => {
      const item = saleWithItems.items.find((si) => si.id === input.saleItemId);
      if (!item) throw new Error("Item no encontrado");
      if (item.isReturned) {
        throw new Error("El item ya fue devuelto");
      }
      if (!input.quantity || input.quantity <= 0) {
        throw new Error("La cantidad a devolver debe ser mayor a cero");
      }
      if (input.quantity > item.quantity) {
        throw new Error(
          "La cantidad a devolver no puede superar la cantidad vendida",
        );
      }

      const unitPaid = getProratedUnitPaid(
        sale.totalAmount,
        originalItems,
        item,
      );
      const refunded = roundMoney(
        unitPaid * input.quantity -
          Number(input.restockingFee || 0) * input.quantity,
      );
      totalRefunded += refunded;

      return {
        sourceSaleItemId: item.id,
        saleItemId: item.id,
        tenantId: sale.tenantId,
        quantity: input.quantity,
        originalQuantity: item.quantity,
        itemSnapshot: item,
        condition: input.condition,
        restockingFee: input.restockingFee,
        refundedAmount: refunded,
      };
    });

    for (const reversalItem of reversalItems) {
      if (reversalItem.quantity < reversalItem.originalQuantity) {
        await this.saleRepo.updateSaleItem(reversalItem.sourceSaleItemId, {
          quantity: reversalItem.originalQuantity - reversalItem.quantity,
        });

        const splitItemId = `SRET-${crypto.randomUUID()}`;
        await this.saleRepo.createSaleItem(
          {
            ...reversalItem.itemSnapshot,
            id: splitItemId,
            quantity: reversalItem.quantity,
            isReturned: true,
            returnedAt: new Date(),
            returnCondition: reversalItem.condition,
          },
          sale.tenantId,
        );

        reversalItem.saleItemId = splitItemId;
      } else {
        await this.saleRepo.updateSaleItem(reversalItem.saleItemId, {
          isReturned: true,
          returnedAt: new Date(),
          returnCondition: reversalItem.condition,
        });
      }
    }

    await this.reversalRepo.addReversal({
      id: `REV-${crypto.randomUUID()}`,
      saleId,
      tenantId: sale.tenantId,
      type: "return",
      reason,
      items: reversalItems.map((item) => ({
        saleItemId: item.saleItemId,
        tenantId: item.tenantId,
        condition: item.condition,
        restockingFee: item.restockingFee,
        refundedAmount: item.refundedAmount,
      })),
      totalRefunded,
      createdAt: new Date(),
      createdBy: userId,
    });

    await this.saleRepo.addSaleItemStatusHistory(
      reversalItems.map((item) => ({
        tenantId: sale.tenantId,
        saleItemId: item.saleItemId,
        fromStatus:
          sale.status === "vendido_pendiente_entrega"
            ? "vendido_pendiente_entrega"
            : "vendido",
        toStatus: "devuelto",
        reason: reason || "RETURN_PROCESSED",
        changedBy: userId,
        createdAt: new Date(),
      })),
    );

    const updatedSaleWithItems = await this.saleRepo.getSaleWithItems(saleId);
    const updatedItems = updatedSaleWithItems.items;
    const allReturned = updatedItems.every((item) => item.isReturned === true);

    await this.saleRepo.updateSale(saleId, {
      amountRefunded: sale.amountRefunded + totalRefunded,
      status: allReturned ? "devuelto" : sale.status,
      returnedAt: allReturned ? new Date() : sale.returnedAt,
      updatedAt: new Date(),
      updatedBy: userId,
    });

    for (const reversalItem of reversalItems) {
      const saleItem = reversalItem.itemSnapshot;

      if (reversalItem.condition !== "perfecto") {
        throw new Error("No se aceptan devoluciones en este estado");
      }

      if (saleItem.inventoryItemId) {
        await this.inventoryRepo.updateItemStatus(
          saleItem.inventoryItemId,
          "disponible",
          sale.branchId,
          userId,
        );
        continue;
      }

      if (saleItem.stockId && sale.status === "vendido") {
        await this.inventoryRepo.increaseLotQuantity(
          saleItem.stockId,
          reversalItem.quantity,
        );
      }
    }

    if (totalRefunded > 0) {
      const payments = await this.paymentRepo.getPaymentsByOperationId(
        sale.operationId,
      );
      const firstPaymentMethod = payments[0]?.paymentMethodId || "cash";

      await this.paymentRepo.addPayment({
        id: `PAY-${crypto.randomUUID()}`,
        tenantId: sale.tenantId,
        operationId: sale.operationId,
        amount: totalRefunded,
        paymentMethodId: firstPaymentMethod,
        direction: "out",
        status: "posted",
        category: "refund",
        date: new Date(),
        createdAt: new Date(),
        notes: `Reembolso neto por devolución (comisión restada). Razón: ${reason}`,
        receivedById: userId,
        branchId: sale.branchId,
      } as Payment);
    }
  }
}
