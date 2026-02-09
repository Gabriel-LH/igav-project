// src/services/reservation/checkAttributeAvailability.ts
import { useReservationStore } from "@/src/store/useReservationStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { startOfDay, endOfDay } from "date-fns";

export function getAvailabilityByAttributes(productId: string, size: string, color: string) {
  const { reservations, reservationItems } = useReservationStore.getState();
  const { stock } = useInventoryStore.getState();

  // 1. Contar cuántas unidades físicas existen en total para este combo
  const totalPhysicalStock = stock.filter(
    (s) => 
      String(s.productId) === String(productId) && 
      s.size === size && 
      s.color === color &&
      s.status !== "baja" // No contamos lo que está roto/eliminado
  ).length;

  // 2. Obtener todas las reservas activas para este combo
  const activeReservations = reservationItems
    .filter(
      (item) =>
        item.productId === productId &&
        item.size === size &&
        item.color === color &&
        item.itemStatus === "confirmada"
    )
    .map((item) => {
      const parent = reservations.find((r) => r.id === item.reservationId);
      return {
        start: startOfDay(parent!.startDate),
        end: endOfDay(parent!.endDate),
      };
    });

  return { totalPhysicalStock, activeReservations };
}