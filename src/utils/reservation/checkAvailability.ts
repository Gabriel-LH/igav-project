// src/services/reservation/checkAttributeAvailability.ts
import { useReservationStore } from "@/src/store/useReservationStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useRentalStore } from "@/src/store/useRentalStore";
import {
  startOfDay,
  endOfDay,
  areIntervalsOverlapping,
  addDays,
} from "date-fns";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";

// Tipo de operación para TypeScript
export type OpType = "venta" | "alquiler";

// =========================================================================
// HELPER 1: Contar Stock Físico (DINÁMICO)
// =========================================================================
export function getTotalStock(
  productId: string,
  size: string,
  color: string,
  type: OpType,
) {
  const { stock } = useInventoryStore.getState();

  return stock
    .filter(
      (s) =>
        String(s.productId) === String(productId) &&
        s.size === size &&
        s.color === color &&
        s.status !== "baja" &&
        s.status !== "vendido" &&
        s.status !== "agotado" &&
        s.status !== "vendido_pendiente_entrega" &&
        // 🔥 LA CORRECCIÓN MAESTRA:
        (type === "venta"
          ? s.isForSale === true && s.status === "disponible" // Venta: Solo lo "disponible"
          : s.isForRent === true), // Alquiler: Todo el parque (excepto agotado/baja/vendido)
    )
    .reduce((acc, s) => acc + s.quantity, 0); // Sumamos cantidad, no filas
}

// =========================================================================
// HELPER 2: Genera todos los intervalos ocupados
// =========================================================================
function getAllOccupiedIntervals(
  productId: string,
  size: string,
  color: string,
  type: OpType,
) {
  const { reservations, reservationItems } = useReservationStore.getState();
  const { rentals, rentalItems } = useRentalStore.getState();
  const { stock } = useInventoryStore.getState();

  const rules = BUSINESS_RULES_MOCK;
  const bufferDays =
    (rules.daysInLaundry || 0) + (rules.daysInMaintenance || 0);

  const occupiedList: { start: Date; end: Date; quantity: number }[] = [];

  // --- SI ES VENTA, LAS REGLAS DE ALQUILER NO APLICAN ---
  // (A menos que quieras bloquear ventas si hay reservas de venta, pero simplifiquemos)
  if (type === "venta") {
    // Para ventas, generalmente solo nos importa si está reservado PARA VENTA.
    // Si tu lógica de negocio dice que un item de ALQUILER no bloquea VENTA (porque son stocks distintos),
    // entonces aquí devolvemos vacío o solo reservas de venta.
    // *Asumiremos que los stocks están separados (Sale vs Rent)*.

    // Aquí podrías filtrar solo reservas de tipo 'venta' si quisieras.
    // Por ahora, devolvemos vacío para que el calendario de venta aparezca libre
    // (controlado solo por cantidad total).
    return [];
  }

  // --- SI ES ALQUILER, APLICAMOS TODA LA LÓGICA DE FECHAS ---

  // 1. RESERVAS CONFIRMADAS
  const activeReservationItems = reservationItems.filter(
    (item) =>
      String(item.productId) === String(productId) &&
      item.size === size &&
      item.color === color &&
      item.itemStatus === "confirmada",
  );

  activeReservationItems.forEach((item) => {
    const parent = reservations.find((r) => r.id === item.reservationId);
    if (parent) {
      occupiedList.push({
        start: startOfDay(new Date(parent.startDate)),
        end: endOfDay(addDays(new Date(parent.endDate), bufferDays)),
        quantity: item.quantity || 1,
      });
    }
  });

  // 2. ALQUILERES ACTIVOS
  const activeRentalItems = rentalItems.filter(
    (item) =>
      String(item.productId) === String(productId) &&
      item.size === size &&
      item.color === color &&
      item.itemStatus === "alquilado",
  );

  activeRentalItems.forEach((item) => {
    const parent = rentals.find((r) => r.id === item.rentalId);
    if (parent && parent.status === "alquilado") {
      occupiedList.push({
        start: startOfDay(new Date(parent.outDate)),
        end: endOfDay(addDays(new Date(parent.expectedReturnDate), bufferDays)),
        quantity: item.quantity || 1,
      });
    }
  });

  // 3. MANTENIMIENTO
  const itemsInMaintenance = stock.filter(
    (s) =>
      String(s.productId) === String(productId) &&
      s.size === size &&
      s.color === color &&
      (s.status === "en_lavanderia" || s.status === "en_mantenimiento") &&
      s.isForRent === true, // Solo nos importa si es de alquiler
  );

  itemsInMaintenance.forEach(() => {
    occupiedList.push({
      start: startOfDay(new Date()),
      end: endOfDay(addDays(new Date(), bufferDays)),
      quantity: 1,
    });
  });

  return occupiedList;
}

// =========================================================================
// FUNCIÓN PÚBLICA 1: Validación puntual
// =========================================================================
export function getAvailabilityByAttributes(
  productId: string,
  size: string,
  color: string,
  startDate: Date,
  endDate: Date,
  type: OpType, // <--- NUEVO PARAMETRO (Default alquiler para no romper)
) {
  // 1. Buscamos stock según el tipo (Venta busca isForSale, Alquiler busca isForRent)
  const totalCount = getTotalStock(productId, size, color, type);

  // 2. Buscamos ocupación según el tipo
  const occupiedIntervals = getAllOccupiedIntervals(
    productId,
    size,
    color,
    type,
  );

  // Si es VENTA, occupiedIntervals estará vacío, así que availableCount = totalCount.
  // Si es ALQUILER, restará las fechas ocupadas.

  const requestedInterval = {
    start: startOfDay(startDate),
    end: endOfDay(endDate),
  };

  const conflictingCount = occupiedIntervals
    .filter((interval) => areIntervalsOverlapping(requestedInterval, interval))
    .reduce((sum, interval) => sum + interval.quantity, 0);

  const availableCount = totalCount - conflictingCount;

  return {
    available: availableCount > 0,
    totalCount,
    committedCount: conflictingCount,
    availableCount,
    reason:
      availableCount > 0 ? "Disponible" : `Stock insuficiente para ${type}.`,
  };
}

// =========================================================================
// FUNCIÓN PÚBLICA 2: Datos para el Calendario
// =========================================================================
export function getReservationDataByAttributes(
  productId: string,
  size: string,
  color: string,
  type: OpType = "alquiler", // <--- NUEVO PARAMETRO
) {
  const totalPhysicalStock = getTotalStock(productId, size, color, type);
  const activeReservations = getAllOccupiedIntervals(
    productId,
    size,
    color,
    type,
  );

  return { totalPhysicalStock, activeReservations };
}
