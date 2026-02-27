import { Reservation } from "../../types/reservation/type.reservation";
import { ReservationItem } from "../../types/reservation/type.reservationItem";

export interface ReservationRepository {
  addReservation(
    reservation: Reservation,
    reservationItems: ReservationItem[],
  ): void;
  updateStatus(id: string, newStatus: string, itemStatus: string): void;
  updateReservationItemStatus(itemId: string, status: string): void;
  getReservationItems(): ReservationItem[];
  getReservationById(id: string): Reservation | undefined;
  cancelReservation(id: string): void;
}
