import { SaleRepository } from "@/src/domain/tenant/repositories/SaleRepository";
import { InventoryRepository } from "@/src/domain/tenant/repositories/InventoryRepository";
import { ReservationRepository } from "@/src/domain/tenant/repositories/ReservationRepository";
import { SaleDTO } from "@/src/application/dtos/SaleDTO";
import { SaleFromReservationDTO } from "@/src/application/dtos/SaleFromReservationDTO";
import { saleSchema } from "@/src/types/sales/type.sale";
import { InventoryItemStatus } from "@/src/utils/status-type/InventoryItemStatusType";
import { DEFAULT_TENANT_CONFIG, DEFAULT_TENANT_POLICY_SECTIONS } from "@/src/lib/tenant-defaults";
import { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";

export class CreateSaleUseCase {
  constructor(
    private saleRepo: SaleRepository,
    private inventoryRepo: InventoryRepository,
    private reservationRepo: ReservationRepository,
  ) {}

  private resolveTenantConfig(snapshot: unknown): TenantConfig {
    if (snapshot && typeof snapshot === "object") {
      const raw = (snapshot as { tenant?: TenantConfig }).tenant ?? snapshot;
      return {
        ...(DEFAULT_TENANT_CONFIG as TenantConfig),
        ...(raw as TenantConfig),
      };
    }
    return DEFAULT_TENANT_CONFIG as TenantConfig;
  }

  private resolveTenantPolicy(snapshot: unknown): TenantPolicy {
    const base: TenantPolicy = {
      ...(DEFAULT_TENANT_POLICY_SECTIONS as TenantPolicy),
      id: "policy-default",
      tenantId: "",
      version: 1,
      isActive: true,
      createdAt: new Date(0),
      updatedBy: "system",
      changeReason: undefined,
    };

    if (snapshot && typeof snapshot === "object") {
      return {
        ...base,
        ...(snapshot as TenantPolicy),
        sales: {
          ...base.sales,
          ...(snapshot as TenantPolicy).sales,
        },
      };
    }

    return base;
  }

  async execute(
    dto: SaleDTO | SaleFromReservationDTO,
    operationId: string,
    tenantId: string,
    totalAmount: number,
    paymentMethodId: string,
  ): Promise<any> {
    const now = new Date();
    const fromReservation =
      "reservationId" in dto && Array.isArray((dto as any).reservationItems);
    const tenantConfig = this.resolveTenantConfig(
      (dto as any).configSnapshot,
    );

    const tenantPolicy = this.resolveTenantPolicy(
      (dto as any).policySnapshot,
    );

    const requestedStatus = dto.status as string;
    const resolvedStatus =
      tenantPolicy.sales?.autoCompleteDelivery &&
      (requestedStatus === "pendiente_entrega" ||
        requestedStatus === "vendido_pendiente_entrega")
        ? "vendido"
        : requestedStatus;

    const validateDiscountPolicy = (item: {
      listPrice?: number;
      priceAtMoment?: number;
      discountAmount?: number;
      promotionId?: string;
      bundleId?: string;
    }) => {
      const listPrice = item.listPrice ?? item.priceAtMoment ?? 0;
      const totalDiscount =
        item.discountAmount ??
        Math.max(0, listPrice - (item.priceAtMoment ?? listPrice));
      
      const hasPromo = Boolean(item.promotionId || item.bundleId);
      const isManualOnly = totalDiscount > 0 && !hasPromo;

      // 1. Verificar si se permiten descuentos manuales
      if (isManualOnly && !tenantPolicy.sales?.allowPriceEdit) {
        throw new Error("No se permiten descuentos manuales en ventas.");
      }

      // 2. Verificar tope máximo (Total: Manual + Promocional)
      if (totalDiscount > 0 && listPrice > 0) {
        const percent = (totalDiscount / listPrice) * 100;
        const maxPercent = tenantConfig.pricing.maxDiscountLimit;
        
        if (percent > maxPercent) {
          const errorMsg = hasPromo 
            ? `El descuento total (${percent.toFixed(1)}%) incluyendo promociones excede el máximo permitido (${maxPercent}%).`
            : `El descuento manual (${percent.toFixed(1)}%) excede el máximo permitido (${maxPercent}%).`;
          throw new Error(errorMsg);
        }
      }

      // 3. Verificar acumulación (Stacking)
      if (hasPromo && (item.discountAmount ?? 0) > 0 && !tenantConfig.pricing.allowDiscountStacking) {
         // Si hay promo Y descuento manual, y la config prohíbe acumular
         throw new Error("La política actual no permite acumular promociones con descuentos manuales.");
      }
    };

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
      status: resolvedStatus,
      // paymentMethod: paymentMethodId, // Removed as it is not in schema
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
        "convertida",
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
          
          const isItemSerial = reservationItem.isSerial || false;

          const saleItem = {
            id: `SITEM-${item.reservationItemId}`,
            saleId: specificData.id,
            productId: reservationItem.productId,
            variantId: reservationItem.variantId,
            stockId: isItemSerial ? undefined : item.stockId,
            inventoryItemId: isItemSerial ? item.stockId : undefined,
            quantity: reservationItem.quantity ?? 1,
            priceAtMoment: reservationItem.priceAtMoment,
            listPrice: reservationItem.listPrice,
            discountAmount: reservationItem.discountAmount ?? 0,
            discountReason: reservationItem.discountReason,
            bundleId: reservationItem.bundleId,
            promotionId: reservationItem.promotionId,
            isReturned: false,
          };

          validateDiscountPolicy(saleItem);
          return saleItem;
        },
      );
    } else {
      saleItems = (dto as SaleDTO).items.map((item) => {
        const saleItem = {
        id: `SITEM-${Math.random().toString(36).substring(2, 9)}`,
        saleId: specificData.id,
        productId: item.productId,
        variantId: item.variantId,
        stockId: item.inventoryItemId ? undefined : (item as any).stockId,
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity ?? 1,
        priceAtMoment: item.priceAtMoment,
        listPrice: item.listPrice,
        discountAmount: item.discountAmount ?? 0,
        discountReason: item.discountReason,
        bundleId: item.bundleId,
        promotionId: item.promotionId,
        isReturned: false,
        };

        validateDiscountPolicy(saleItem);
        return saleItem;
      });
    }

    await this.saleRepo.addSale(specificData, saleItems);

    // Stock management
    for (const item of saleItems) {
      let finalStockStatus: InventoryItemStatus | string = "vendido";

      switch (resolvedStatus) {
        case "reservado":
          finalStockStatus = "reservado";
          break;
        case "pendiente_entrega":
        case "vendido_pendiente_entrega":
          finalStockStatus = "vendido_pendiente_entrega";
          break;
        case "vendido":
        default:
          finalStockStatus = "vendido";
          break;
      }

      const stockIdToUpdate = item.inventoryItemId || item.stockId;

      if (item.inventoryItemId) {
        await this.inventoryRepo.updateItemStatus(
          item.inventoryItemId,
          finalStockStatus as any,
          dto.branchId,
          dto.sellerId,
        );
      } else if (item.stockId) {
        if (finalStockStatus === "vendido") {
          await this.inventoryRepo.decreaseLotQuantity(
            item.stockId,
            item.quantity,
          );
        }
      }
    }

    return specificData;
  }
}
