import { useSaleStore } from "@/src/store/useSaleStore";

export function markSaleAsPendingDeliveryUseCase({
  saleId,
  sellerId,
}: {
  saleId: string;
  sellerId: string;
}) {
  const store = useSaleStore.getState();

  const sale = store.sales.find(s => s.id === saleId);
  if (!sale) throw new Error("Venta no encontrada");

  if (sale.status !== "pendiente_pago") return;

  store.updateSale(saleId, {
    status: "pendiente_entrega",
    updatedAt: new Date(),
    updatedBy: sellerId,
  });
}
