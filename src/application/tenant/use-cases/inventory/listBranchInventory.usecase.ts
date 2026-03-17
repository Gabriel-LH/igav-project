import { ProductRepository } from "../../../../domain/tenant/repositories/ProductRepository";
import { StockRepository } from "../../../../domain/tenant/repositories/StockRepository";
import { Product } from "../../../../types/product/type.product";
import { ProductVariant } from "../../../../types/product/type.productVariant";
import { InventoryItem } from "../../../../types/product/type.inventoryItem";
import { StockLot } from "../../../../types/product/type.stockLote";

interface ListBranchInventoryInput {
  tenantId: string;
  branchId: string;
}

interface ListBranchInventoryOutput {
  products: Product[];
  variants: ProductVariant[];
  inventoryItems: InventoryItem[];
  stockLots: StockLot[];
}

export class ListBranchInventoryUseCase {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly stockRepo: StockRepository,
  ) {}

  async execute(
    input: ListBranchInventoryInput,
  ): Promise<ListBranchInventoryOutput> {
    const [products, variants, stockLots, inventoryItems] = await Promise.all([
      this.productRepo.getProductsByTenant(input.tenantId),
      this.productRepo.getVariantsByTenant(input.tenantId),
      this.stockRepo.getLotsByTenant(input.tenantId),
      this.stockRepo.getItemsByTenant(input.tenantId),
    ]);

    const filteredStockLots = stockLots.filter(
      (lot) => lot.branchId === input.branchId,
    );

    const filteredInventoryItems = inventoryItems.filter(
      (item) => item.branchId === input.branchId,
    );

    return {
      products,
      variants,
      inventoryItems: filteredInventoryItems,
      stockLots: filteredStockLots,
    };
  }
}
