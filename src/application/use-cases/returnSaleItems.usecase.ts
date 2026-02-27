import { SaleRepository } from "../../domain/repositories/SaleRepository";
import { SaleReversalRepository } from "../../domain/repositories/SaleReversalRepository";
import { InventoryRepository } from "../../domain/repositories/InventoryRepository";
import { PaymentRepository } from "../../domain/repositories/PaymentRepository";

export interface ReturnSaleItemsInput {
  saleId: string;
  reason: string;
  userId: string;
  items: {
    saleItemId: string;
    condition?: "perfecto" | "dañado" | "manchado";
    restockingFee: number;
  }[];
}

export class ReturnSaleItemsUseCase {
  constructor(
    private saleRepo: SaleRepository,
    private reversalRepo: SaleReversalRepository,
    private inventoryRepo: InventoryRepository,
    private paymentRepo: PaymentRepository,
  ) {}

  execute({ saleId, items, reason, userId }: ReturnSaleItemsInput): void {
    const sale = this.saleRepo.getSaleById(saleId);

    if (!sale) throw new Error("Venta no encontrada");
    if (sale.status === "cancelado") {
      throw new Error("No se puede devolver una venta anulada");
    }

    const saleWithItems = this.saleRepo.getSaleWithItems(saleId);

    let totalRefunded = 0;

    const reversalItems = items.map((i) => {
      const item = saleWithItems.items.find((si) => si.id === i.saleItemId);
      if (!item) throw new Error("Item no encontrado");
      if (item.isReturned) {
        throw new Error("El item ya fue devuelto");
      }

      const refunded = item.priceAtMoment - (i.restockingFee || 0);
      totalRefunded += refunded;

      return {
        saleItemId: item.id,
        condition: i.condition,
        restockingFee: i.restockingFee,
        refundedAmount: refunded,
      };
    });

    this.reversalRepo.addReversal({
      id: `REV-${crypto.randomUUID()}`,
      saleId,
      type: "return",
      reason,
      items: reversalItems,
      totalRefunded,
      createdAt: new Date(),
      createdBy: userId,
    });

    // 1️⃣ actualizar items
    reversalItems.forEach((ri) => {
      this.saleRepo.updateSaleItem(ri.saleItemId, {
        isReturned: true,
        returnedAt: new Date(),
        returnCondition: ri.condition,
      });
    });

    // 2️⃣ LEER ESTADO NUEVO (clave)
    const updatedItems = this.saleRepo.getSaleWithItems(saleId).items;
    const allReturned = updatedItems.every((i) => i.isReturned === true);

    // 3️⃣ actualizar venta
    this.saleRepo.updateSale(saleId, {
      amountRefunded: sale.amountRefunded + totalRefunded,
      status: allReturned ? "devuelto" : sale.status,
      returnedAt: allReturned ? new Date() : sale.returnedAt,
      updatedAt: new Date(),
      updatedBy: userId,
    });

    reversalItems.forEach((ri) => {
      const saleItem = saleWithItems.items.find((i) => i.id === ri.saleItemId)!;

      if (ri.condition !== "perfecto") {
        throw new Error("No se aceptan devoluciones en este estado");
      }

      this.inventoryRepo.updateItemStatus(saleItem.stockId, "disponible");
    });

    if (totalRefunded > 0) {
      const payments = this.paymentRepo.getPaymentsByOperationId(
        sale.operationId,
      );
      const firstPaymentMethod = payments[0]?.method || "cash";

      this.paymentRepo.addPayment({
        id: `PAY-${crypto.randomUUID()}`,
        operationId: sale.operationId,
        amount: totalRefunded,
        method: firstPaymentMethod,
        direction: "out",
        status: "posted",
        category: "refund",
        date: new Date(),
        notes: `Reembolso neto por devolución (comisión restada). Razón: ${reason}`,
        receivedById: userId,
        branchId: sale.branchId,
      } as any);
    }
  }
}
