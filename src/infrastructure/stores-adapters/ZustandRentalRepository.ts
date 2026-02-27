import { RentalRepository } from "../../domain/repositories/RentalRepository";
import { Rental } from "../../types/rentals/type.rentals";
import { RentalItem } from "../../types/rentals/type.rentalsItem";
import { useRentalStore } from "../../store/useRentalStore";

export class ZustandRentalRepository implements RentalRepository {
  addRental(rental: Rental, rentalItems: RentalItem[]): void {
    useRentalStore.getState().addRental(rental, rentalItems);
  }

  getRentalById(id: string): Rental | undefined {
    return useRentalStore.getState().rentals.find((r) => r.id === id);
  }

  getRentalByOperationId(operationId: string): Rental | undefined {
    return useRentalStore
      .getState()
      .rentals.find((r) => String(r.operationId) === String(operationId));
  }

  getRentalItemById(id: string): RentalItem | undefined {
    return useRentalStore.getState().rentalItems.find((i) => i.id === id);
  }

  processReturnItem(itemId: string, status: string): void {
    const store = useRentalStore.getState();
    const item = store.rentalItems.find((i) => i.id === itemId);
    if (!item) return;

    store.processReturnItem(itemId, status);
  }

  updateRental(id: string, data: Partial<Rental>): void {
    useRentalStore.getState().updateRental(id, data);
  }

  getRentalItemsByRentalId(rentalId: string): RentalItem[] {
    return useRentalStore
      .getState()
      .rentalItems.filter((i) => i.rentalId === rentalId);
  }

  cancelRental(id: string, reason?: string): void {
    return useRentalStore.getState().cancelRental(id, reason);
  }
}
