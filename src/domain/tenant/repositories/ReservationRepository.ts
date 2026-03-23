import { Reservation } from "../../../types/reservation/type.reservation";
import { ReservationItem } from "../../../types/reservation/type.reservationItem";

export interface ReservationRepository {
  addReservation(
    reservation: Reservation,
    reservationItems: ReservationItem[],
  ): Promise<void>;
  updateStatus(id: string, newStatus: string, itemStatus: string): Promise<void>;
  updateReservationItemStatus(itemId: string, status: string): Promise<void>;
  getReservationItems(): Promise<ReservationItem[]>;
  getReservationById(id: string): Promise<Reservation | undefined>;
  cancelReservation(id: string): Promise<void>;
}
