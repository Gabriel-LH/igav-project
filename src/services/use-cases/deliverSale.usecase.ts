// src/services/use-cases/deliverSale.usecase.ts

import { useSaleStore } from "@/src/store/useSaleStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useReservationStore } from "@/src/store/useReservationStore";
import { USER_MOCK } from "@/src/mocks/mock.user";

export function deliverSaleUseCase(saleId: string) {
  const now = new Date();
  const user = USER_MOCK[0];

  const saleStore = useSaleStore.getState();
  const inventoryStore = useInventoryStore.getState();
  const reservationStore = useReservationStore.getState();

  const sale = saleStore.sales.find((s) => s.id === saleId);

  if (!sale) {
    throw new Error("Venta no encontrada");
  }

  // 1️⃣ Validar estado
  if (sale.status !== "pendiente_entrega") {
    throw new Error(
      `No se puede entregar una venta en estado ${sale.status}`,
    );
  }

  // 2️⃣ Obtener items
  const saleItems = saleStore.saleItems.filter(
    (item) => item.saleId === sale.id,
  );

  if (saleItems.length === 0) {
    throw new Error("La venta no tiene items");
  }

  // 3️⃣ Entrega física (inventario)
  saleItems.forEach((item) => {
    if (!item.stockId) {
      throw new Error(
        `Item ${item.id} no tiene stock asignado`,
      );
    }

    inventoryStore.deliverAndTransfer(
      item.stockId,
      "vendido",
      sale.branchId,
      user.id,
    );
  });

  // 4️⃣ Actualizar estado de la venta
  saleStore.updateSale(sale.id, {
    status: "vendido",
    updatedAt: now,
    updatedBy: user.id,
  });

  // 5️⃣ Si viene de reserva → marcar como convertida
  if (sale.reservationId) {
    reservationStore.updateStatus(
      sale.reservationId,
      "venta",
      "convertida",
    );
  }

  return sale;
}
