import { Reservation } from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { Operation } from "@/src/types/operation/type.operations";

export function getCountableReservations(
  reservations: Reservation[] = [],
): Reservation[] {
  return reservations.filter((reservation) => reservation.status === "confirmada");
}

export function getCountableReservationOperationIds(
  reservations: Reservation[] = [],
): Set<string> {
  return new Set(
    getCountableReservations(reservations).map((reservation) =>
      String(reservation.operationId),
    ),
  );
}

export function filterCountableReservationItems(
  reservationItems: ReservationItem[] = [],
  reservations: Reservation[] = [],
): ReservationItem[] {
  const activeReservationIds = new Set(
    getCountableReservations(reservations).map((reservation) =>
      String(reservation.id),
    ),
  );

  return reservationItems.filter(
    (item) =>
      item.itemStatus === "confirmada" &&
      activeReservationIds.has(String(item.reservationId)),
  );
}

export function isCountableOperation(
  operation: Operation,
  countableReservationOperationIds: Set<string>,
): boolean {
  if (operation.status === "cancelado") return false;
  if (operation.type !== "reserva") return true;
  return countableReservationOperationIds.has(String(operation.id));
}
