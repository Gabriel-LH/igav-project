import { ReservationRepository } from "../../../domain/tenant/repositories/ReservationRepository";
import { Reservation } from "../../../types/reservation/type.reservation";
import { ReservationItem } from "../../../types/reservation/type.reservationItem";
import { useReservationStore } from "../../../store/useReservationStore";

export class ZustandReservationRepository implements ReservationRepository {
  async addReservation(
    reservation: Reservation,
    reservationItems: ReservationItem[],
  ): Promise<void> {
    useReservationStore
      .getState()
      .addReservation(reservation, reservationItems);
  }

  async getReservations(): Promise<Reservation[]> {
    return useReservationStore.getState().reservations;
  }

  async updateStatus(
    id: string,
    newStatus: string,
    itemStatus: string,
  ): Promise<void> {
    useReservationStore
      .getState()
      .updateStatus(id, newStatus as any, itemStatus as any);
  }

  async updateReservationItemStatus(
    itemId: string,
    status: string,
  ): Promise<void> {
    useReservationStore
      .getState()
      .updateReservationItemStatus(itemId, status as any);
  }

  async getReservationItems(): Promise<ReservationItem[]> {
    return useReservationStore.getState().reservationItems;
  }

  async getReservationById(id: string): Promise<Reservation | undefined> {
    return useReservationStore.getState().reservations.find((r) => r.id === id);
  }

  async cancelReservation(id: string): Promise<void> {
    useReservationStore.getState().cancelReservation(id);
  }
}
