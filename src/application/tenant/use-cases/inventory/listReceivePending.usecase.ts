import { StockRepository } from "../../../../domain/tenant/repositories/StockRepository";
import { StockLot } from "../../../../types/product/type.stockLote";
import { InventoryItem } from "../../../../types/product/type.inventoryItem";

export interface ListReceivePendingInput {
  tenantId: string;
  branchId?: string;
}

export interface ListReceivePendingResult {
  stockLots: StockLot[];
  serializedItems: InventoryItem[];
}

export class ListReceivePendingUseCase {
  constructor(private readonly stockRepo: StockRepository) {}

  async execute(
    input: ListReceivePendingInput,
  ): Promise<ListReceivePendingResult> {
    const [lots, items] = await Promise.all([
      this.stockRepo.getLotsByTenant(input.tenantId),
      this.stockRepo.getItemsByTenant(input.tenantId),
    ]);

    const stockLots = lots.filter(
      (lot) =>
        lot.status === "en_transito" &&
        (!input.branchId || lot.branchId === input.branchId),
    );

    const serializedItems = items.filter(
      (item) =>
        item.status === "en_transito" &&
        (!input.branchId || item.branchId === input.branchId),
    );

    return { stockLots, serializedItems };
  }
}
