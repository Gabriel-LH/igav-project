import { InventoryRepository } from "../../../../domain/tenant/repositories/InventoryRepository";
import { InventoryItem } from "../../../../types/product/type.inventoryItem";
import { SerializedItemFormData } from "../../../interfaces/inventory/SerializedItemFormData";

interface CreateSerializedItemsInput {
  tenantId: string;
  formData: SerializedItemFormData;
}

export class CreateSerializedItemsUseCase {
  constructor(private inventoryRepo: InventoryRepository) {}

  execute(input: CreateSerializedItemsInput): InventoryItem[] {
    const now = new Date();

    const items: InventoryItem[] = input.formData.serialCodes.map(
      (serialCode) => ({
        id: `inv-${crypto.randomUUID()}`,
        tenantId: input.tenantId,
        serialCode,
        variantId: input.formData.variantId,
        productId: input.formData.productId,
        branchId: input.formData.branchId,
        isForRent: input.formData.isForRent,
        isForSale: input.formData.isForSale,
        usageCount: 0,
        lastMaintenance: input.formData.lastMaintenance,
        condition: input.formData.condition,
        status: input.formData.status,
        damageNotes: input.formData.damageNotes,
        createdAt: now,
        updatedAt: now,
      }),
    );

    this.inventoryRepo.addInventoryItems(items);
    return items;
  }
}
