// src/services/use-cases/deliverRental.usecase.ts

import { useRentalStore } from "@/src/store/useRentalStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useReservationStore } from "@/src/store/useReservationStore";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";

export function deliverRentalUseCase(rentalId: string, guaranteeData: { value: string; type: GuaranteeType }) {
  const now = new Date();
  const user = USER_MOCK[0];

  const rentalStore = useRentalStore.getState();
  const inventoryStore = useInventoryStore.getState();
  const reservationStore = useReservationStore.getState();
  const guaranteeStore = useGuaranteeStore.getState();

  const rental = rentalStore.rentals.find((s) => s.id === rentalId);

  console.log("rental en deliverRentalUseCase", rental);

  if (!rental) {
    throw new Error("Alquiler no encontrado");
  }

  // 1️⃣ Validar estado
  if (rental.status !== "reservado_fisico") {
    throw new Error(
      `No se puede entregar un alquiler en estado ${rental.status}`,
    );
  }

  // 2️⃣ Obtener items
  const rentalItems = rentalStore.rentalItems.filter(
    (item) => item.rentalId === rental.id,
  );

  if (rentalItems.length === 0) {
    throw new Error("El alquiler no tiene items");
  }

  if (rental.guaranteeId && guaranteeData) {
    guaranteeStore.updateGuarantee({
        id: rental.guaranteeId,
        type: guaranteeData.type,
        value: guaranteeData.value,
        status: "custodia",
    });
  }

  // 3️⃣ Entrega física (inventario)
  rentalItems.forEach((item) => {
    if (!item.stockId) {
      throw new Error(`Item ${item.id} no tiene stock asignado`);
    }

    inventoryStore.updateItemStatus(
      item.stockId,
      "alquilado",
      rental.branchId,
      user.id,
    );

    inventoryStore.decreaseLotQuantity(item.stockId, 1);
  });

  // 4️⃣ Actualizar estado del alquiler   
  rentalStore.updateRental(rental.id, {
    status: "alquilado",
    updatedAt: now,
    updatedBy: user.id,
  });

  // 5️⃣ Si viene de reserva → marcar como convertida
  if (rental.reservationId) {
    reservationStore.updateStatus(
      rental.reservationId,
      "alquiler",
      "convertida",
    );
  }
  return rental;
}
