import { SaleRepository } from "../../../domain/tenant/repositories/SaleRepository";
import { SaleReversalRepository } from "../../../domain/tenant/repositories/SaleReversalRepository";
import { InventoryRepository } from "../../../domain/tenant/repositories/InventoryRepository";
import { PaymentRepository } from "../../../domain/tenant/repositories/PaymentRepository";
import { Payment } from "../../../types/payments/type.payments";

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

  async execute({ saleId, items, reason, userId }: ReturnSaleItemsInput): Promise<void> {
    const sale = await this.saleRepo.getSaleById(saleId);

    if (!sale) throw new Error("Venta no encontrada");
    if (sale.status === "cancelado") {
      throw new Error("No se puede devolver una venta anulada");
    }

    const saleWithItems = await this.saleRepo.getSaleWithItems(saleId);

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
        tenantId: sale.tenantId,
        condition: i.condition,
        restockingFee: i.restockingFee,
        refundedAmount: refunded,
      };
    });

    await this.reversalRepo.addReversal({
      id: `REV-${crypto.randomUUID()}`,
      saleId,
      tenantId: sale.tenantId,
      type: "return",
      reason,
      items: reversalItems,
      totalRefunded,
      createdAt: new Date(),
      createdBy: userId,
    });

    // 1️⃣ actualizar items
    for (const ri of reversalItems) {
      await this.saleRepo.updateSaleItem(ri.saleItemId, {
        isReturned: true,
        returnedAt: new Date(),
        returnCondition: ri.condition,
      });
    }

    // 2️⃣ LEER ESTADO NUEVO (clave)
    const updatedSaleWithItems = await this.saleRepo.getSaleWithItems(saleId);
    const updatedItems = updatedSaleWithItems.items;
    const allReturned = updatedItems.every((i) => i.isReturned === true);

    // 3️⃣ actualizar venta
    await this.saleRepo.updateSale(saleId, {
      amountRefunded: sale.amountRefunded + totalRefunded,
      status: allReturned ? "devuelto" : sale.status,
      returnedAt: allReturned ? new Date() : sale.returnedAt,
      updatedAt: new Date(),
      updatedBy: userId,
    });

    for (const ri of reversalItems) {
      const saleItem = saleWithItems.items.find((i) => i.id === ri.saleItemId)!;

      if (ri.condition !== "perfecto") {
        throw new Error("No se aceptan devoluciones en este estado");
      }

      await this.inventoryRepo.updateItemStatus(saleItem.stockId, "disponible");
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
