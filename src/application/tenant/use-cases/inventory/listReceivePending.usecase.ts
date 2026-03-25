import { StockRepository } from "../../../../domain/tenant/repositories/StockRepository";
import { StockLot } from "../../../../types/product/type.stockLote";
import { InventoryItem } from "../../../../types/product/type.inventoryItem";

export interface ListReceivePendingInput {
  tenantId: string;
  branchId?: string;
  lotStatuses?: Array<StockLot["status"]>;
  itemStatuses?: Array<InventoryItem["status"]>;
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

    const lotStatusFilter =
      input.lotStatuses === undefined
        ? new Set<StockLot["status"]>(["en_transito"])
        : new Set(input.lotStatuses);

    const itemStatusFilter =
      input.itemStatuses === undefined
        ? new Set<InventoryItem["status"]>(["en_transito"])
        : new Set(input.itemStatuses);

    const stockLots = lots.filter(
      (lot) =>
        lotStatusFilter.has(lot.status) &&
        (!input.branchId || lot.branchId === input.branchId),
    );

    const serializedItems = items.filter(
      (item) =>
        itemStatusFilter.has(item.status) &&
        (!input.branchId || item.branchId === input.branchId),
    );

    return { stockLots, serializedItems };
  }
}
