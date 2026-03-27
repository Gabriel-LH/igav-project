import { SaleRepository } from "@/src/domain/tenant/repositories/SaleRepository";
import { InventoryRepository } from "@/src/domain/tenant/repositories/InventoryRepository";
import { ReservationRepository } from "@/src/domain/tenant/repositories/ReservationRepository";
import { Sale } from "@/src/types/sales/type.sale";

export class DeliverSaleUseCase {
  constructor(
    private saleRepo: SaleRepository,
    private inventoryRepo: InventoryRepository,
    private reservationRepo: ReservationRepository,
  ) {}

  async execute(saleId: string, userId: string): Promise<Sale> {
    const now = new Date();
    const sale = await this.saleRepo.getSaleById(saleId);

    if (!sale) {
      throw new Error("Venta no encontrada");
    }

    if (sale.status !== "vendido_pendiente_entrega") {
      throw new Error(
        `No se puede entregar una venta en estado ${sale.status}`,
      );
    }

    const saleItems = (await this.saleRepo.getSaleWithItems(sale.id)).items;

    if (saleItems.length === 0) {
      throw new Error("La venta no tiene items");
    }

    for (const item of saleItems) {
      if (item.inventoryItemId) {
        await this.inventoryRepo.updateItemStatus(
          item.inventoryItemId,
          "vendido",
          sale.branchId,
          userId,
        );
        continue;
      }

      if (item.stockId) {
        await this.inventoryRepo.decreaseLotQuantity(item.stockId, item.quantity);
        continue;
      }

      throw new Error(`Item ${item.id} no tiene stock asignado`);
    }

    await this.saleRepo.updateSale(sale.id, {
      status: "vendido",
      updatedAt: now,
      updatedBy: userId,
    });

    if (sale.reservationId) {
      await this.reservationRepo.updateStatus(
        sale.reservationId,
        "convertida",
        "convertida",
      );
    }

    return sale;
  }
}
