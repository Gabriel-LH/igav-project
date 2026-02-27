import { ReservationRepository } from "../../domain/repositories/ReservationRepository";
import { Reservation } from "../../types/reservation/type.reservation";
import { ReservationItem } from "../../types/reservation/type.reservationItem";
import { useReservationStore } from "../../store/useReservationStore";

export class ZustandReservationRepository implements ReservationRepository {
  addReservation(
    reservation: Reservation,
    reservationItems: ReservationItem[],
  ): void {
    useReservationStore
      .getState()
      .addReservation(reservation, reservationItems);
  }

  updateStatus(id: string, newStatus: string, itemStatus: string): void {
    useReservationStore
      .getState()
      .updateStatus(id, newStatus as any, itemStatus as any);
  }

  updateReservationItemStatus(itemId: string, status: string): void {
    useReservationStore
      .getState()
      .updateReservationItemStatus(itemId, status as any);
  }

  getReservationItems(): ReservationItem[] {
    return useReservationStore.getState().reservationItems;
  }

  getReservationById(id: string): Reservation | undefined {
    return useReservationStore.getState().reservations.find((r) => r.id === id);
  }

  cancelReservation(id: string): void {
    useReservationStore.getState().cancelReservation(id);
  }
}
