// src/services/reservation/checkAttributeAvailability.ts
import { useReservationStore } from "@/src/store/useReservationStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { startOfDay, endOfDay, areIntervalsOverlapping } from "date-fns";

export function getAvailabilityByAttributes(
  productId: string,
  size: string,
  color: string,
  startDate: Date,
  endDate: Date,
  excludeReservationId?: string, // Para cuando editas una reserva existente
) {
  const { stock } = useInventoryStore.getState();
  const { reservations, reservationItems } = useReservationStore.getState();

  // 1. Contar Stock Físico Total (Que no esté vendido, ni de baja, ni perdido)
  // OJO: Aquí incluimos los "disponibles", "reservado_fisico" y "alquilado".
  // ¿Por qué? Porque lo que importa es cuántos existen en el mundo,
  // luego descontaremos los ocupados.
  const totalItems = stock.filter(
    (s) =>
      s.productId === productId &&
      s.size === size &&
      s.color === color &&
      s.status !== "baja" &&
      s.status !== "vendido", // Lo vendido ya no cuenta
  );

  const totalCount = totalItems.length;

  if (totalCount === 0)
    return { available: false, reason: "No existe stock físico" };

  // 2. Buscar TODOS los compromisos en ese rango de fechas
  // Esto incluye:
  // A. Alquileres activos (Directos)
  // B. Reservas confirmadas (Virtuales)

  // (Aquí simplifico usando tu store de reservas, asumiendo que los alquileres directos
  // también generan una "reserva" o "bloqueo" en el sistema, o consultando RentalStore)

  const requestedInterval = {
    start: startOfDay(startDate),
    end: endOfDay(endDate),
  };

  const conflictingReservations = reservationItems.filter((item) => {
    if (
      item.productId !== productId ||
      item.size !== size ||
      item.color !== color
    )
      return false;
    if (item.itemStatus === "cancelada" || item.itemStatus === "expirada")
      return false;

    // Buscar la reserva padre para ver las fechas
    const parent = reservations.find((r) => r.id === item.reservationId);
    if (!parent) return false;

    // Si es la misma reserva que estamos editando, ignorar
    if (excludeReservationId && parent.id === excludeReservationId)
      return false;

    // Verificar choque de fechas
    return areIntervalsOverlapping(requestedInterval, {
      start: startOfDay(parent.startDate),
      end: endOfDay(parent.endDate),
    });
  });

  const committedCount = conflictingReservations.length;
  const availableCount = totalCount - committedCount;

  return {
    available: availableCount > 0,
    totalCount,
    committedCount,
    availableCount,
    reason:
      availableCount > 0
        ? "Disponible"
        : `Solo tienes ${totalCount} unidades y hay ${committedCount} reservas para esas fechas.`,
  };
}

export function getReservationDataByAttributes(
  productId: string,
  size: string,
  color: string,
) {
  const { stock } = useInventoryStore.getState();
  const { reservations, reservationItems } = useReservationStore.getState();

  // 1. Contar Stock Físico Total
  const totalItems = stock.filter(
    (s) =>
      s.productId === productId &&
      s.size === size &&
      s.color === color &&
      s.status !== "baja" &&
      s.status !== "vendido",
  );

  const totalPhysicalStock = totalItems.length;

  // 2. Obtener TODAS las reservas activas para mapearlas en el calendario
  const activeReservations = reservationItems
    .filter((item) => {
      // Coincidir producto
      if (
        item.productId !== productId ||
        item.size !== size ||
        item.color !== color
      )
        return false;

      // Ignorar canceladas o expiradas
      if (item.itemStatus === "cancelada" || item.itemStatus === "expirada")
        return false;

      return true;
    })
    .map((item) => {
      const parent = reservations.find((r) => r.id === item.reservationId);
      if (!parent) return null;

      return {
        start: startOfDay(new Date(parent.startDate)),
        end: endOfDay(new Date(parent.endDate)),
        quantity: item.quantity,
      };
    })
    // Filtrar nulls y asegurar tipo
    .filter((r): r is { start: Date; end: Date; quantity: number } => r !== null);

  return { totalPhysicalStock, activeReservations };
}
