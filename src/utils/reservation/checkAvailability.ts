// src/utils/reservation/checkAvailability.ts
import { useReservationStore } from "@/src/store/useReservationStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useRentalStore } from "@/src/store/useRentalStore";
import { startOfDay, endOfDay, areIntervalsOverlapping } from "date-fns";

export type OpType = "venta" | "alquiler";

export function getTotalStock(
  productId: string,
  variantId: string,
  type: OpType,
) {
  const { products, inventoryItems, stockLots } = useInventoryStore.getState();
  const product = products.find((productItem) => String(productItem.id) === String(productId));

  if (!product) return 0;

  if (product.is_serial) {
    return inventoryItems.filter(
      (item) =>
        String(item.productId) === String(productId) &&
        item.variantId === variantId &&
        item.status === "disponible" &&
        (type === "venta" ? item.isForSale === true : item.isForRent === true),
    ).length;
  }

  return stockLots
    .filter(
      (lot) =>
        String(lot.productId) === String(productId) &&
        lot.variantId === variantId &&
        lot.status === "disponible" &&
        (type === "venta" ? lot.isForSale === true : lot.isForRent === true),
    )
    .reduce((acc, lot) => acc + lot.quantity, 0);
}

function getAllOccupiedIntervals(
  productId: string,
  variantId: string,
  type: OpType,
) {
  const { reservations, reservationItems } = useReservationStore.getState();
  const { rentals, rentalItems } = useRentalStore.getState();

  const occupiedList: { start: Date; end: Date; quantity: number }[] = [];

  if (type === "venta") return [];

  reservationItems
    .filter(
      (item) =>
        String(item.productId) === String(productId) &&
        item.variantId === variantId &&
        item.itemStatus === "confirmada",
    )
    .forEach((item) => {
      const parent = reservations.find((reservation) => reservation.id === item.reservationId);
      if (!parent) return;

      occupiedList.push({
        start: startOfDay(new Date(parent.startDate)),
        end: endOfDay(new Date(parent.endDate)),
        quantity: item.quantity || 1,
      });
    });

  const rentalMap = new Map(rentals.map((rental) => [rental.id, rental]));

  rentalItems
    .filter(
      (item) =>
        String(item.productId) === String(productId) &&
        item.variantId === variantId &&
        item.itemStatus === "alquilado",
    )
    .forEach((item) => {
      const parent = rentalMap.get(item.rentalId);
      if (
        parent &&
        ["alquilado", "atrasado", "reservado_fisico"].includes(parent.status)
      ) {
        occupiedList.push({
          start: startOfDay(new Date(parent.outDate)),
          end: endOfDay(
            new Date(parent.actualReturnDate ?? parent.expectedReturnDate),
          ),
          quantity: item.quantity,
        });
      }
    });

  return occupiedList;
}

export function getAvailabilityByAttributes(
  productId: string,
  variantId: string,
  startDate: Date,
  endDate: Date,
  type: OpType,
) {
  const totalCount = getTotalStock(productId, variantId, type);
  const occupiedIntervals = getAllOccupiedIntervals(productId, variantId, type);

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
      availableCount > 0
        ? "Disponible"
        : "Stock insuficiente. Solo se considera stock actualmente disponible.",
  };
}

export function getReservationDataByAttributes(
  productId: string,
  variantId: string,
  type: OpType = "alquiler",
) {
  const totalPhysicalStock = getTotalStock(productId, variantId, type);
  const activeReservations = getAllOccupiedIntervals(productId, variantId, type);

  return {
    totalPhysicalStock,
    activeReservations,
  };
}
