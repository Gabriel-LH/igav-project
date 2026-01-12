// src/utils/get-product-reservation.ts
import { MOCK_RESERVATION_ITEM } from "@/src/mocks/mock.reservationItem";
import { RESERVATIONS_MOCK } from "@/src/mocks/mock.reservation";

// src/utils/get-product-reservation.ts
export const getReservationsByProductId = (productId: string) => {
  const items = MOCK_RESERVATION_ITEM.filter(i => i.productId === productId);
  const resIds = items.map(i => i.reservationId);
  
  // Filtramos todas las reservas que coincidan y estén activas
  const activeReservations = RESERVATIONS_MOCK.filter(
    (r) => resIds.includes(r.id) && ["pendiente", "confirmada"].includes(r.status)
  );

  return {
    isReserved: activeReservations.length > 0,
    activeReservations, // Devolvemos el ARRAY completo
    reservationCount: activeReservations.length,
    // Para no romper la UI actual, mantenemos estos como referencia al primero
    activeReservation: activeReservations[0],
    reservedItem: items.find(i => i.reservationId === activeReservations[0]?.id)
  };
};