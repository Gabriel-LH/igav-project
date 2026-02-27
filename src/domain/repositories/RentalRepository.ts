import { Rental } from "../../types/rentals/type.rentals";
import { RentalItem } from "../../types/rentals/type.rentalsItem";

export interface RentalRepository {
  addRental(rental: Rental, rentalItems: RentalItem[]): void;
  getRentalById(id: string): Rental | undefined;
  getRentalItemById(id: string): RentalItem | undefined;
  getRentalByOperationId(operationId: string): Rental | undefined;
  getRentalItemsByRentalId(rentalId: string): RentalItem[];
  processReturnItem(itemId: string, status: string): void;
  updateRental(id: string, data: Partial<Rental>): void;
  cancelRental(id: string, reason?: string): void;
}
