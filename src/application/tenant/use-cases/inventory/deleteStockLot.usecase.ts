import { InventoryRepository } from "../../../../domain/tenant/repositories/InventoryRepository";

interface DeleteStockLotInput {
  stockLotId: string;
}

export class DeleteStockLotUseCase {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  execute(input: DeleteStockLotInput): void {
    this.inventoryRepo.removeStockLot(input.stockLotId);
  }
}
