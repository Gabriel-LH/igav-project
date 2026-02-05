// domain/sales/use-cases/syncSaleWithOperation.usecase.ts

import { useOperationStore } from "@/src/store/useOperationStore";
import { useSaleStore } from "@/src/store/useSaleStore";

export async function syncSaleWithOperationUseCase(operationId: string) {
  const saleStore = useSaleStore.getState();
  const operation = useOperationStore
    .getState()
    .operations.find((o) => o.id === operationId);
  if (!operation) return;

  const sale = saleStore.sales.find((s) => s.operationId === operationId);
  if (!sale) return;

  if (
    operation.paymentStatus === "pagado" &&
    sale.status === "pendiente_pago"
  ) {
    saleStore.updateSale(sale.id, {
      status: "pendiente_entrega",
    });
  }
}
