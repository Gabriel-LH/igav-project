import { StockRepository } from "../../../../domain/tenant/repositories/StockRepository";
import { InventoryItem } from "../../../../types/product/type.inventoryItem";

export interface AssignSerializedItemsInput {
  tenantId: string;
  productId: string;
  variantId: string;
  branchId: string;
  serialCodes: string[];
  isForRent: boolean;
  isForSale: boolean;
  condition?: "Nuevo" | "Usado" | "Vintage";
  damageNotes?: string;
  status?: "en_transito" | "disponible" | "alquilado" | "vendido";
}

export class AssignSerializedItemsUseCase {
  constructor(private stockRepo: StockRepository) {}

  async execute(input: AssignSerializedItemsInput): Promise<InventoryItem[]> {
    if (input.serialCodes.length === 0) {
      throw new Error("Debe proporcionar al menos un código serial");
    }

    const items: (Partial<InventoryItem> & { tenantId: string })[] = input.serialCodes.map(code => ({
      tenantId: input.tenantId,
      productId: input.productId,
      variantId: input.variantId,
      branchId: input.branchId,
      serialCode: code,
      isForRent: input.isForRent,
      isForSale: input.isForSale,
      condition: input.condition || "Nuevo",
      status: input.status || "en_transito",
      damageNotes: input.damageNotes,
    }));

    return await this.stockRepo.addInventoryItems(items);
  }
}
