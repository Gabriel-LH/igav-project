import { SaleRepository } from "../../domain/repositories/SaleRepository";
import { SaleReversalRepository } from "../../domain/repositories/SaleReversalRepository";
import { InventoryRepository } from "../../domain/repositories/InventoryRepository";
import { PaymentRepository } from "../../domain/repositories/PaymentRepository";
import { OperationRepository } from "../../domain/repositories/OperationRepository";
import { differenceInHours } from "date-fns";
import { SaleReversal } from "../../types/sales/type.saleReversal";

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

  execute({ saleId, reason, userId }: CancelSaleInput): void {
    const sale = this.saleRepo.getSaleById(saleId);
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

    const saleWithItems = this.saleRepo.getSaleWithItems(saleId);

    const reversal: SaleReversal = {
      id: `REV-${crypto.randomUUID()}`,
      saleId: sale.id,
      type: "annulment" as const,
      reason,
      totalRefunded: sale.totalAmount,
      createdAt: new Date(),
      createdBy: userId,
      items: [],
    };

    this.reversalRepo.addReversal(reversal);

    // 2️⃣ Stock vuelve a disponible (por item)
    saleWithItems.items.forEach((item) => {
      this.inventoryRepo.updateItemStatus(
        item.stockId,
        "disponible",
        sale.branchId,
        userId,
      );
    });

    this.saleRepo.updateSale(sale.id, {
      status: "cancelado",
      canceledAt: new Date(),
      amountRefunded: sale.totalAmount,
      updatedAt: new Date(),
      updatedBy: userId,
    });

    const payments = this.paymentRepo.getPaymentsByOperationId(
      sale.operationId,
    );

    payments.forEach((payment) => {
      this.paymentRepo.addPayment({
        id: `PAY-${crypto.randomUUID()}`,
        operationId: sale.operationId,
        amount: payment.amount,
        method: payment.method,
        direction: "out",
        status: "posted",
        category: "correction",
        date: new Date(),
        notes: `Anulación de venta: ${reason}`,
        receivedById: userId,
        branchId: sale.branchId,
      } as any);
    });

    this.operationRepo.updateOperationStatus(sale.operationId, "cancelado");
  }
}
