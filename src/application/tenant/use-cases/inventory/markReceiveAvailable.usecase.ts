import { StockRepository } from "../../../../domain/tenant/repositories/StockRepository";
import { StockLot } from "../../../../types/product/type.stockLote";
import { InventoryItem } from "../../../../types/product/type.inventoryItem";

export type ReceiveItemType = "stock" | "serialized";

export interface MarkReceiveAvailableInput {
  tenantId: string;
  type: ReceiveItemType;
  stockId?: string;
  itemId?: string;
}

export type MarkReceiveAvailableResult = StockLot | InventoryItem;

export class MarkReceiveAvailableUseCase {
  constructor(private readonly stockRepo: StockRepository) {}

  async execute(
    input: MarkReceiveAvailableInput,
  ): Promise<MarkReceiveAvailableResult> {
    if (input.type === "stock") {
      if (!input.stockId) {
        throw new Error("stockId es obligatorio para recibir stock");
      }
      return this.stockRepo.updateStockLotStatus(
        input.stockId,
        "disponible",
      );
    }

    if (!input.itemId) {
      throw new Error("itemId es obligatorio para recibir serializados");
    }

    return this.stockRepo.updateInventoryItemStatus(
      input.itemId,
      "disponible",
    );
  }
}
