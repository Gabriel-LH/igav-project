import { SaleRepository } from "@/src/domain/tenant/repositories/SaleRepository";
import { SaleReversalRepository } from "@/src/domain/tenant/repositories/SaleReversalRepository";
import { InventoryRepository } from "@/src/domain/tenant/repositories/InventoryRepository";
import { PaymentRepository } from "@/src/domain/tenant/repositories/PaymentRepository";
import { OperationRepository } from "@/src/domain/tenant/repositories/OperationRepository";
import { differenceInHours } from "date-fns";
import { SaleReversal } from "@/src/types/sales/type.saleReversal";
import { Payment } from "@/src/types/payments/type.payments";

export interface CancelSaleInput {
  saleId: string;
  reason: string;
  userId: string;
}

export class CancelSaleUseCase {
  constructor(
    private saleRepo: SaleRepository,
    private reversalRepo: SaleReversalRepository,
    private inventoryRepo: InventoryRepository,
    private paymentRepo: PaymentRepository,
    private operationRepo: OperationRepository,
  ) {}

  async execute({ saleId, reason, userId }: CancelSaleInput): Promise<void> {
    const sale = await this.saleRepo.getSaleById(saleId);
    if (!sale) throw new Error("Venta no encontrada");

    if (sale.status === "cancelado") {
      throw new Error("La venta ya está anulada");
    }

    if (sale.amountRefunded > 0) {
      throw new Error("No se puede anular una venta con devoluciones");
    }

    const hours = differenceInHours(new Date(), sale.createdAt);
    if (hours > 24) {
      throw new Error("Solo se puede anular ventas dentro de las 24h");
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
      await this.inventoryRepo.updateItemStatus(
        item.stockId,
        "disponible",
        sale.branchId,
        userId,
      );
    }

    await this.saleRepo.updateSale(sale.id, {
      status: "cancelado",
      canceledAt: new Date(),
      amountRefunded: sale.totalAmount,
      updatedAt: new Date(),
      updatedBy: userId,
    });

    const payments = await this.paymentRepo.getPaymentsByOperationId(
      sale.operationId,
    );

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

    await this.operationRepo.updateOperationStatus(sale.operationId, "cancelado");
  }
}
