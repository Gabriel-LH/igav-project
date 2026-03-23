import { SaleRepository } from "@/src/domain/tenant/repositories/SaleRepository";
import { InventoryRepository } from "@/src/domain/tenant/repositories/InventoryRepository";
import { ReservationRepository } from "@/src/domain/tenant/repositories/ReservationRepository";
import { SaleDTO } from "@/src/application/dtos/SaleDTO";
import { SaleFromReservationDTO } from "@/src/application/dtos/SaleFromReservationDTO";
import { saleSchema } from "@/src/types/sales/type.sale";
import { InventoryItemStatus } from "@/src/utils/status-type/InventoryItemStatusType";

export class CreateSaleUseCase {
  constructor(
    private saleRepo: SaleRepository,
    private inventoryRepo: InventoryRepository,
    private reservationRepo: ReservationRepository,
  ) {}

  async execute(
    dto: SaleDTO | SaleFromReservationDTO,
    operationId: string,
    tenantId: string,
    totalAmount: number,
    paymentMethod: string,
  ): Promise<any> {
    const now = new Date();
    const fromReservation =
      "reservationId" in dto && Array.isArray((dto as any).reservationItems);

    const specificData = saleSchema.parse({
      id: crypto.randomUUID(),
      tenantId,
      operationId: String(operationId),
      customerId: dto.customerId,
      reservationId: fromReservation
        ? (dto as SaleFromReservationDTO).reservationId
        : undefined,
      branchId: dto.branchId,
      sellerId: dto.sellerId,
      totalAmount: totalAmount,
      saleDate: now,
      status: dto.status,
      paymentMethod: paymentMethod,
      amountRefunded: 0,
      notes: (dto as any).notes || "",
      createdAt: now,
      updatedAt: now,
    });

    let saleItems: any[] = [];

    if (fromReservation) {
      const reservationItemsData = await this.reservationRepo.getReservationItems();
      
      await this.reservationRepo.updateStatus(
        (dto as SaleFromReservationDTO).reservationId,
        "venta",
        "convertida",
      );
      for (const item of (dto as SaleFromReservationDTO).reservationItems) {
        await this.reservationRepo.updateReservationItemStatus(
          item.reservationItemId,
          "convertida",
        );
      }

      saleItems = (dto as SaleFromReservationDTO).reservationItems.map(
        (item) => {
          const reservationItem = reservationItemsData.find(
            (ri) => ri.id === item.reservationItemId,
          );
          if (!reservationItem)
            throw new Error(`ReservationItem no encontrado`);
          return {
            id: `SITEM-${item.reservationItemId}`,
            saleId: specificData.id,
            productId: reservationItem.productId,
            stockId: item.stockId,
            quantity: reservationItem.quantity ?? 1,
            priceAtMoment: reservationItem.priceAtMoment,
            listPrice: reservationItem.listPrice,
            discountAmount: reservationItem.discountAmount ?? 0,
            discountReason: reservationItem.discountReason,
            bundleId: reservationItem.bundleId,
            promotionId: reservationItem.promotionId,
            isReturned: false,
          };
        },
      );
    } else {
      saleItems = (dto as SaleDTO).items.map((item) => ({
        id: `SITEM-${Math.random().toString(36).substring(2, 9)}`,
        saleId: specificData.id,
        productId: item.productId,
        stockId: item.stockId,
        quantity: item.quantity ?? 1,
        priceAtMoment: item.priceAtMoment,
        listPrice: item.listPrice,
        discountAmount: item.discountAmount ?? 0,
        discountReason: item.discountReason,
        bundleId: item.bundleId,
        promotionId: item.promotionId,
        isReturned: false,
      }));
    }

    await this.saleRepo.addSale(specificData, saleItems);

    // Stock management
    for (const item of saleItems) {
      let finalStockStatus: InventoryItemStatus | string = "vendido";

      switch (dto.status) {
        case "reservado":
          finalStockStatus = "reservado";
          break;
        case "pendiente_entrega":
          finalStockStatus = "vendido_pendiente_entrega";
          break;
        case "vendido":
        default:
          finalStockStatus = "vendido";
          break;
      }

      if (await this.inventoryRepo.isSerial(item.stockId)) {
        await this.inventoryRepo.updateItemStatus(
          item.stockId,
          finalStockStatus,
          dto.branchId,
          dto.sellerId,
        );
      } else {
        if (
          finalStockStatus === "vendido" ||
          finalStockStatus === "vendido_pendiente_entrega"
        ) {
          await this.inventoryRepo.decreaseLotQuantity(item.stockId, item.quantity);
        }
      }
    }

    return specificData;
  }
}
