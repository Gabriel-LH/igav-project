import { InventoryRepository } from "../../../domain/repositories/InventoryRepository";
import { StockFormData } from "../../interfaces/stock/StockFormData";
import { StockLot } from "../../../types/product/type.stockLote";

interface CreateStockLotInput {
  tenantId: string;
  formData: StockFormData;
}

export class CreateStockLotUseCase {
  constructor(private inventoryRepo: InventoryRepository) {}

  execute(input: CreateStockLotInput): StockLot {
    const now = new Date();
    const stockLot: StockLot = {
      id: `lot-${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      productId: input.formData.productId,
      variantId: input.formData.variantId,
      branchId: input.formData.branchId,
      quantity: input.formData.quantity,
      barcode: input.formData.barcode || input.formData.variantBarcode,
      expirationDate: input.formData.expirationDate,
      lotNumber: input.formData.lotNumber,
      isForRent: input.formData.isForRent,
      isForSale: input.formData.isForSale,
      status: input.formData.status,
      createdAt: now,
      updatedAt: now,
    };

    this.inventoryRepo.addStockLot(stockLot);
    return stockLot;
  }
}
