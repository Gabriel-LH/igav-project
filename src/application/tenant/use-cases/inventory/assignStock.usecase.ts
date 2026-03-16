import { StockRepository } from "../../../../domain/tenant/repositories/StockRepository";
import { StockLot } from "../../../../types/product/type.stockLote";

export interface AssignStockInput {
  tenantId: string;
  productId: string;
  variantId: string;
  branchId: string;
  quantity: number;
  barcode?: string;
  expirationDate?: Date;
  lotNumber?: string;
  isForRent: boolean;
  isForSale: boolean;
  condition?: "Nuevo" | "Usado" | "Vintage";
}

export class AssignStockUseCase {
  constructor(private stockRepo: StockRepository) {}

  async execute(input: AssignStockInput): Promise<StockLot> {
    if (input.quantity <= 0) {
      throw new Error("La cantidad debe ser mayor a 0");
    }

    return await this.stockRepo.addStockLot({
      tenantId: input.tenantId,
      productId: input.productId,
      variantId: input.variantId,
      branchId: input.branchId,
      quantity: input.quantity,
      barcode: input.barcode,
      expirationDate: input.expirationDate,
      lotNumber: input.lotNumber,
      isForRent: input.isForRent,
      isForSale: input.isForSale,
      condition: input.condition || "Nuevo",
      status: "en_transito", // Default initial status as requested
    });
  }
}
