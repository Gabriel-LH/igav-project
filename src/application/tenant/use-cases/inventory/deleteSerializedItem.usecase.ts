import { InventoryRepository } from "../../../../domain/tenant/repositories/InventoryRepository";

interface DeleteSerializedItemInput {
  itemId: string;
}

export class DeleteSerializedItemUseCase {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  execute(input: DeleteSerializedItemInput): void {
    this.inventoryRepo.removeInventoryItem(input.itemId);
  }
}
