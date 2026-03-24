import { Rental } from "../../../types/rentals/type.rentals";
import { RentalItem } from "../../../types/rentals/type.rentalsItem";

export interface RentalRepository {
  addRental(rental: Rental, rentalItems: RentalItem[]): Promise<void>;
  getRentals(): Promise<Rental[]>;
  getRentalItems(): Promise<RentalItem[]>;
  getRentalById(id: string): Promise<Rental | undefined>;
  getRentalItemById(id: string): Promise<RentalItem | undefined>;
  getRentalByOperationId(operationId: string): Promise<Rental | undefined>;
  getRentalItemsByRentalId(rentalId: string): Promise<RentalItem[]>;
  processReturnItem(itemId: string, status: string): Promise<void>;
  updateRental(id: string, data: Partial<Rental>): Promise<void>;
  cancelRental(id: string, reason?: string): Promise<void>;
}
