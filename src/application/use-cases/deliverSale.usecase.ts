import { SaleRepository } from "../../domain/repositories/SaleRepository";
import { InventoryRepository } from "../../domain/repositories/InventoryRepository";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository";
import { Sale } from "../../types/sales/type.sale";

export class DeliverSaleUseCase {
  constructor(
    private saleRepo: SaleRepository,
    private inventoryRepo: InventoryRepository,
    private reservationRepo: ReservationRepository,
  ) {}

  execute(saleId: string, userId: string): Sale {
    const now = new Date();
    const sale = this.saleRepo.getSaleById(saleId);

    if (!sale) {
      throw new Error("Venta no encontrada");
    }

    if (sale.status !== "vendido_pendiente_entrega") {
      throw new Error(
        `No se puede entregar una venta en estado ${sale.status}`,
      );
    }

    const saleItems = this.saleRepo.getSaleWithItems(sale.id).items;

    if (saleItems.length === 0) {
      throw new Error("La venta no tiene items");
    }

    saleItems.forEach((item) => {
      if (!item.stockId) {
        throw new Error(`Item ${item.id} no tiene stock asignado`);
      }

      this.inventoryRepo.decreaseLotQuantity(item.stockId, item.quantity);
    });

    this.saleRepo.updateSale(sale.id, {
      status: "vendido",
      updatedAt: now,
      updatedBy: userId,
    });

    if (sale.reservationId) {
      this.reservationRepo.updateStatus(
        sale.reservationId,
        "venta",
        "convertida",
      );
    }

    return sale;
  }
}
