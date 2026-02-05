import { useSaleStore } from "@/src/store/useSaleStore";
import { useSaleReversalStore } from "@/src/store/useSaleReversalStore";
import { differenceInHours } from "date-fns";

export function cancelSaleUseCase({
  saleId,
  reason,
  userId,
}: {
  saleId: string;
  reason: string;
  userId: string;
}) {
  const saleStore = useSaleStore.getState();
  const reversalStore = useSaleReversalStore.getState();

  const sale = saleStore.sales.find((s) => s.id === saleId);
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

  const reversal = {
    id: `REV-${crypto.randomUUID()}`,
    saleId: sale.id,
    type: "annulment" as const,
    reason,
    totalRefunded: sale.totalAmount,
    createdAt: new Date(),
    createdBy: userId,
  };

  reversalStore.addReversal(reversal);

  saleStore.updateSale(sale.id, {
    status: "cancelado",
    canceledAt: new Date(),
    amountRefunded: sale.totalAmount,
    updatedAt: new Date(),
    updatedBy: userId,
  });
}
