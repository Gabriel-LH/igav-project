import { useSaleStore } from "@/src/store/useSaleStore";
import { useSaleReversalStore } from "@/src/store/useSaleReversalStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { usePaymentStore } from "@/src/store/usePaymentStore";

export function returnSaleItemsUseCase({
  saleId,
  items,
  reason,
  userId,
}: {
  saleId: string;
  reason: string;
  userId: string;
  items: {
    saleItemId: string;
    condition?: "perfecto" | "dañado" | "manchado";
    restockingFee: number;
  }[];
}) {
  const reversalStore = useSaleReversalStore.getState();

  const sale = useSaleStore.getState().sales.find((s) => s.id === saleId);

  const paymentStore = usePaymentStore.getState();

  if (!sale) throw new Error("Venta no encontrada");
  if (sale.status === "cancelado") {
    throw new Error("No se puede devolver una venta anulada");
  }

  const saleWithItems = useSaleStore.getState().getSaleWithItems(saleId);

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

  reversalStore.addReversal({
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
    useSaleStore.getState().updateSaleItem(ri.saleItemId, {
      isReturned: true,
      returnedAt: new Date(),
      returnCondition: ri.condition,
    });
  });

  // 2️⃣ LEER ESTADO NUEVO (clave)
  const updatedItems = useSaleStore.getState().getSaleWithItems(saleId).items;

  const allReturned = updatedItems.every((i) => i.isReturned === true);

  // 3️⃣ actualizar venta
  useSaleStore.getState().updateSale(saleId, {
    amountRefunded: sale.amountRefunded + totalRefunded,
    status: allReturned ? "devuelto" : sale.status,
    returnedAt: allReturned ? new Date() : sale.returnedAt,
    updatedAt: new Date(),
    updatedBy: userId,
  });

  reversalItems.forEach((ri) => {
    const saleItem = saleWithItems.items.find((i) => i.id === ri.saleItemId)!;

    // Regla de venta: solo perfecto vuelve a stock, mas adelante se implementara cosas como de reacondicionamiento
    if (ri.condition !== "perfecto") {
      throw new Error("No se aceptan devoluciones en este estado");
    }

    useInventoryStore
      .getState()
      .updateItemStatus(saleItem.stockId, "disponible");

    const payments = paymentStore.payments.filter(
      (p) => p.operationId === sale.operationId,
    );
    payments.forEach((payment) => {
      paymentStore.addPayment({
        id: `PAY-${crypto.randomUUID()}`,
        operationId: sale.operationId,
        amount: payment.amount,
        method: payment.method,
        direction: "out",
        status: "posted",
        category: "refund",
        date: new Date(),
        notes: `Reembolso por devolución de venta: ${reason}`,
        receivedById: userId,
        branchId: sale.branchId,
      });
    });
  });
}
