// src/utils/reservation/checkAvailability.ts
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
  sizeId: string,
  colorId: string,
  type: OpType,
) {
  const { products, inventoryItems, stockLots } = useInventoryStore.getState();
  const product = products.find((p) => String(p.id) === String(productId));

  if (!product) return 0;

  if (product.is_serial) {
    // Caso Seriados: contamos items individuales
    return inventoryItems.filter(
      (s) =>
        String(s.productId) === String(productId) &&
        s.sizeId === sizeId &&
        s.colorId === colorId &&
        s.status !== "baja" &&
        s.status !== "vendido" &&
        s.status !== "agotado" &&
        s.status !== "vendido_pendiente_entrega" &&
        (type === "venta"
          ? s.isForSale === true && s.status === "disponible"
          : s.isForRent === true),
    ).length;
  } else {
    // Caso Lotes: sumamos propiedad quantity
    return stockLots
      .filter(
        (s) =>
          String(s.productId) === String(productId) &&
          s.sizeId === sizeId &&
          s.colorId === colorId &&
          s.status !== "baja" &&
          s.status !== "vendido" &&
          s.status !== "agotado" &&
          s.status !== "vendido_pendiente_entrega" &&
          (type === "venta"
            ? s.isForSale === true && s.status === "disponible"
            : s.isForRent === true),
      )
      .reduce((acc, s) => acc + s.quantity, 0);
  }
}

// =========================================================================
// HELPER 2: Genera todos los intervalos ocupados
// =========================================================================
function getAllOccupiedIntervals(
  productId: string,
  sizeId: string,
  colorId: string,
  type: OpType,
) {
  const { reservations, reservationItems } = useReservationStore.getState();
  const { rentals, rentalItems } = useRentalStore.getState();
  const { products, inventoryItems, stockLots } = useInventoryStore.getState();

  const rules = BUSINESS_RULES_MOCK;
  const bufferDays =
    (rules.daysInLaundry || 0) + (rules.daysInMaintenance || 0);

  const occupiedList: { start: Date; end: Date; quantity: number }[] = [];

  if (type === "venta") {
    // Asumiremos que los stocks están separados (Sale vs Rent).
    return [];
  }

  // 1. RESERVAS CONFIRMADAS
  const activeReservationItems = reservationItems.filter(
    (item) =>
      String(item.productId) === String(productId) &&
      item.sizeId === sizeId &&
      item.colorId === colorId &&
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
      item.sizeId === sizeId &&
      item.colorId === colorId &&
      item.itemStatus === "alquilado",
  );

  const rentalMap = new Map(rentals.map((r) => [r.id, r]));

  activeRentalItems.forEach((item) => {
    const parent = rentalMap.get(item.rentalId);

    if (
      parent &&
      ["alquilado", "atrasado", "reservado_fisico"].includes(parent.status)
    ) {
      occupiedList.push({
        start: startOfDay(parent.outDate),
        end: endOfDay(
          addDays(
            parent.actualReturnDate ?? parent.expectedReturnDate,
            bufferDays,
          ),
        ),
        quantity: item.quantity,
      });
    }
  });

  // 3. MANTENIMIENTO
  const product = products.find((p) => String(p.id) === String(productId));
  if (product) {
    if (product.is_serial) {
      inventoryItems
        .filter(
          (s) =>
            String(s.productId) === String(productId) &&
            s.sizeId === sizeId &&
            s.colorId === colorId &&
            (s.status === "en_lavanderia" || s.status === "en_mantenimiento") &&
            s.isForRent === true,
        )
        .forEach(() => {
          occupiedList.push({
            start: startOfDay(new Date()),
            end: endOfDay(addDays(new Date(), bufferDays)),
            quantity: 1,
          });
        });
    } else {
      stockLots
        .filter(
          (s) =>
            String(s.productId) === String(productId) &&
            s.sizeId === sizeId &&
            s.colorId === colorId &&
            (s.status === "en_lavanderia" || s.status === "en_mantenimiento") &&
            s.isForRent === true,
        )
        .forEach((lot) => {
          occupiedList.push({
            start: startOfDay(new Date()),
            end: endOfDay(addDays(new Date(), bufferDays)),
            quantity: lot.quantity,
          });
        });
    }
  }

  return occupiedList;
}

// =========================================================================
// FUNCIÓN PÚBLICA 1: Validación puntual
// =========================================================================
export function getAvailabilityByAttributes(
  productId: string,
  sizeId: string,
  colorId: string,
  startDate: Date,
  endDate: Date,
  type: OpType,
) {
  const totalCount = getTotalStock(productId, sizeId, colorId, type);

  const occupiedIntervals = getAllOccupiedIntervals(
    productId,
    sizeId,
    colorId,
    type,
  );

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
  sizeId: string,
  colorId: string,
  type: OpType = "alquiler",
) {
  const totalPhysicalStock = getTotalStock(productId, sizeId, colorId, type);
  const activeReservations = getAllOccupiedIntervals(
    productId,
    sizeId,
    colorId,
    type,
  );

  return { totalPhysicalStock, activeReservations };
}
