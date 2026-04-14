import { SaleRepository } from "@/src/domain/tenant/repositories/SaleRepository";
import { SaleReversalRepository } from "@/src/domain/tenant/repositories/SaleReversalRepository";
import { InventoryRepository } from "@/src/domain/tenant/repositories/InventoryRepository";
import { PaymentRepository } from "@/src/domain/tenant/repositories/PaymentRepository";
import { OperationRepository } from "@/src/domain/tenant/repositories/OperationRepository";
import { differenceInHours } from "date-fns";
import { SaleReversal } from "@/src/types/sales/type.saleReversal";
import { Payment } from "@/src/types/payments/type.payments";
import { DEFAULT_TENANT_POLICY_SECTIONS } from "@/src/lib/tenant-defaults";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import { AddClientCreditUseCase } from "../client/addClientCredit.usecase";

export interface CancelSaleInput {
  saleId: string;
  reason: string;
  userId: string;
  refundMethod?: "refund" | "credit";
}

export class CancelSaleUseCase {
  constructor(
    private saleRepo: SaleRepository,
    private reversalRepo: SaleReversalRepository,
    private inventoryRepo: InventoryRepository,
    private paymentRepo: PaymentRepository,
    private operationRepo: OperationRepository,
    private addClientCreditUC: AddClientCreditUseCase,
  ) {}

  async execute({ saleId, reason, userId, refundMethod = "refund" }: CancelSaleInput): Promise<void> {
    const sale = await this.saleRepo.getSaleById(saleId);
    if (!sale) throw new Error("Venta no encontrada");

    if (sale.status === "cancelado") {
      throw new Error("La venta ya está anulada");
    }

    if (sale.amountRefunded > 0) {
      throw new Error("No se puede anular una venta con devoluciones");
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

    if (policy.sales?.requireReasonForCancel && !reason?.trim()) {
      throw new Error("Debes indicar un motivo para anular la venta.");
    }

    const maxCancelHours = policy.sales?.maxCancelHours ?? 24;
    const hours = differenceInHours(new Date(), sale.createdAt);
    if (hours > maxCancelHours) {
      throw new Error(`Solo se puede anular ventas dentro de las primeras ${maxCancelHours} horas`);
    }

    const saleWithItems = await this.saleRepo.getSaleWithItems(saleId);

    const reversal: SaleReversal = {
      id: `REV-${crypto.randomUUID()}`,
      saleId: sale.id,
      tenantId: sale.tenantId,
      type: "annulment" as const,
      reason,
      totalRefunded: sale.totalAmount,
      createdAt: new Date(),
      createdBy: userId,
      items: [],
    };

    await this.reversalRepo.addReversal(reversal);

    // 2️⃣ Stock vuelve a disponible (por item)
    for (const item of saleWithItems.items) {
      if (item.inventoryItemId) {
        await this.inventoryRepo.updateItemStatus(
          item.inventoryItemId,
          "disponible",
          sale.branchId,
          userId,
        );
        continue;
      }

      if (item.stockId && sale.status === "vendido") {
        await this.inventoryRepo.increaseLotQuantity(item.stockId, item.quantity);
      }
    }

    await this.saleRepo.updateSale(sale.id, {
      status: "cancelado",
      canceledAt: new Date(),
      amountRefunded: sale.totalAmount,
      updatedAt: new Date(),
      updatedBy: userId,
    });

    await this.saleRepo.addSaleItemStatusHistory(
      saleWithItems.items.map((item) => ({
        tenantId: sale.tenantId,
        saleItemId: item.id,
        fromStatus:
          sale.status === "vendido_pendiente_entrega"
            ? "vendido_pendiente_entrega"
            : item.isReturned
              ? "devuelto"
              : "vendido",
        toStatus: "cancelado",
        reason: reason || "SALE_CANCELLED",
        changedBy: userId,
        createdAt: new Date(),
      })),
    );

    const payments = await this.paymentRepo.getPaymentsByOperationId(
      sale.operationId,
    );

    if (refundMethod === "credit" && sale.customerId) {
        await this.addClientCreditUC.execute(
          sale.customerId,
          sale.totalAmount,
          "refund",
          sale.operationId
        );

        // Add a single informational payment log showing it was sent to ledger
        await this.paymentRepo.addPayment({
          id: `PAY-${crypto.randomUUID()}`,
          tenantId: sale.tenantId,
          operationId: sale.operationId,
          amount: sale.totalAmount,
          paymentMethodId: "wallet",
          direction: "out",
          status: "posted",
          category: "correction",
          date: new Date(),
          createdAt: new Date(),
          notes: `Anulación de venta - Transferido como crédito a favor: ${reason}`,
          receivedById: userId,
          branchId: sale.branchId,
        } as Payment);
    } else {
        for (const payment of payments) {
          await this.paymentRepo.addPayment({
            id: `PAY-${crypto.randomUUID()}`,
            tenantId: sale.tenantId,
            operationId: sale.operationId,
            amount: payment.amount,
            paymentMethodId: payment.paymentMethodId,
            direction: "out",
            status: "posted",
            category: "correction",
            date: new Date(),
            createdAt: new Date(),
            notes: `Anulación de venta: ${reason}`,
            receivedById: userId,
            branchId: sale.branchId,
          } as Payment);
        }
    }

    await this.operationRepo.updateOperationStatus(sale.operationId, "cancelado");
  }
}
