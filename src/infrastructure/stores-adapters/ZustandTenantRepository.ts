import { TenantRepository } from "../../domain/repositories/TenantRepository";
import { useInventoryStore } from "../../store/useInventoryStore";

export class ZustandTenantRepository implements TenantRepository {
  getTenantIdByTransaction(dto: any): string {
    if (dto.tenantId) return dto.tenantId;

    const inventoryStore = useInventoryStore.getState();

    if ("items" in dto && Array.isArray(dto.items)) {
      const firstItem = dto.items.find((i: any) => i?.productId);
      if (firstItem?.productId) {
        const product = inventoryStore.products.find(
          (p) => p.id === firstItem.productId,
        );
        if (product?.tenantId) return product.tenantId;
      }
    }

    if (
      "reservationItems" in dto &&
      Array.isArray(dto.reservationItems) &&
      dto.reservationItems.length > 0
    ) {
      const firstStockId = dto.reservationItems[0]?.stockId;
      if (firstStockId) {
        const serial = inventoryStore.inventoryItems.find(
          (s) => s.id === firstStockId,
        );
        if (serial?.tenantId) return serial.tenantId;

        const lot = inventoryStore.stockLots.find((l) => l.id === firstStockId);
        if (lot) {
          const lotProduct = inventoryStore.products.find(
            (p) => p.id === lot.productId,
          );
          if (lotProduct?.tenantId) return lotProduct.tenantId;
        }
      }
    }

    throw new Error("No se pudo resolver tenantId para la transacción");
  }
}
