import { RentalRepository } from "../../../domain/tenant/repositories/RentalRepository";
import { Rental } from "../../../types/rentals/type.rentals";
import { RentalItem } from "../../../types/rentals/type.rentalsItem";
import { useRentalStore } from "../../../store/useRentalStore";

export class ZustandRentalRepository implements RentalRepository {
  async addRental(rental: Rental, rentalItems: RentalItem[]): Promise<void> {
    useRentalStore.getState().addRental(rental, rentalItems);
  }

  async getRentals(): Promise<Rental[]> {
    return useRentalStore.getState().rentals;
  }

  async getRentalItems(): Promise<RentalItem[]> {
    return useRentalStore.getState().rentalItems;
  }

  async getRentalById(id: string): Promise<Rental | undefined> {
    return useRentalStore.getState().rentals.find((r) => r.id === id);
  }

  async getRentalByOperationId(operationId: string): Promise<Rental | undefined> {
    return useRentalStore
      .getState()
      .rentals.find((r) => String(r.operationId) === String(operationId));
  }

  async getRentalItemById(id: string): Promise<RentalItem | undefined> {
    return useRentalStore.getState().rentalItems.find((i) => i.id === id);
  }

  async processReturnItem(itemId: string, status: string): Promise<void> {
    const store = useRentalStore.getState();
    const item = store.rentalItems.find((i) => i.id === itemId);
    if (!item) return;

    store.processReturnItem(itemId, status);
  }

  async updateRental(id: string, data: Partial<Rental>): Promise<void> {
    useRentalStore.getState().updateRental(id, data);
  }

  async getRentalItemsByRentalId(rentalId: string): Promise<RentalItem[]> {
    return useRentalStore
      .getState()
      .rentalItems.filter((i) => i.rentalId === rentalId);
  }

  async cancelRental(id: string, reason?: string): Promise<void> {
    return useRentalStore.getState().cancelRental(id, reason);
  }
}
