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

    const resolvedStatus = dto.status || "vendido";

    const validateDiscountPolicy = (item: {
      listPrice?: number;
      priceAtMoment?: number;
      discountAmount?: number;
      promotionId?: string;
      bundleId?: string;
      manualDiscountAmount?: number;
    }) => {
      const listPrice = item.listPrice ?? item.priceAtMoment ?? 0;
      const totalDiscount =
        item.discountAmount ??
        Math.max(0, listPrice - (item.priceAtMoment ?? listPrice));
      
      const hasPromo = Boolean(item.promotionId || item.bundleId);
      const manualDiscountAmount = Math.max(0, item.manualDiscountAmount ?? 0);
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

      // 3. Verificar acumulación (Stacking) de item
      if (hasPromo && manualDiscountAmount > 0 && !tenantConfig.pricing.allowDiscountStacking) {
         throw new Error("La política actual no permite acumular promociones con descuentos manuales.");
      }

      // 4. Verificar acumulación Global (Cupones/Puntos vs Items)
      const hasExtraDiscount = (dto.financials as any).extraDiscountTotal > 0;
      const hasAnyItemDiscount = totalDiscount > 0;
      
      if (hasExtraDiscount && hasAnyItemDiscount && !tenantConfig.pricing.allowDiscountStacking) {
        throw new Error("La política actual no permite acumular cupones o puntos con descuentos en productos (promociones/manuales).");
      }
    };

    const rawCustomerId = dto.customerId || "";
    const hasCustomer = rawCustomerId.trim().length > 0;
    const customerMode = hasCustomer 
      ? (dto.customerMode || "registered") 
      : "general";

    const specificData = saleSchema.parse({
      id: crypto.randomUUID(),
      tenantId,
      operationId: String(operationId),
      customerMode,
      customerId: rawCustomerId,
      reservationId: fromReservation
        ? (dto as SaleFromReservationDTO).reservationId
        : undefined,
      branchId: dto.branchId,
      sellerId: dto.sellerId,
      totalAmount: totalAmount,
      saleDate: now,
      subTotal: dto.financials?.subtotal,
      totalDiscount: dto.financials?.totalDiscount,
      status: resolvedStatus,
      amountRefunded: 0,
      notes: (dto as any).notes || "",
      createdAt: now,
      updatedAt: now,
    });

    const discountsApplied: any[] = [];

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

          if (saleItem.discountAmount > 0) {
            discountsApplied.push({
              id: crypto.randomUUID(),
              tenantId,
              operationId: String(operationId),
              saleId: specificData.id,
              saleItemId: saleItem.id,
              amount: saleItem.discountAmount,
              reason: saleItem.promotionId ? "PROMOTION" : "MANUAL",
              promotionId: saleItem.promotionId || null,
              description: saleItem.discountReason || "Descuento en producto",
              createdAt: now,
            });
          }

          return saleItem;
        },
      );
    } else {
      saleItems = (dto as SaleDTO).items.map((item) => {
        const listPrice = Math.max(
          0,
          Number(
            item.listPrice ??
              (item as any).listPrice ??
              item.priceAtMoment ??
              (item as any).unitPrice ??
              0,
          ),
        );
        const priceAtMoment = Math.max(
          0,
          Number(item.priceAtMoment ?? (item as any).unitPrice ?? listPrice),
        );
        const discountAmount = Math.max(
          0,
          Number(item.discountAmount ?? Math.max(0, listPrice - priceAtMoment)),
        );
        const promotionId =
          (item as any).promotionId ?? (item as any).appliedPromotionId;
        const manualDiscountAmount = Math.max(
          0,
          Number((item as any).manualDiscountAmount ?? 0),
        );

        const saleItem = {
          id: `SITEM-${Math.random().toString(36).substring(2, 9)}`,
          saleId: specificData.id,
          productId: item.productId,
          variantId: item.variantId,
          stockId: (item as any).inventoryItemId ? undefined : (item as any).stockId,
          inventoryItemId: (item as any).inventoryItemId,
          quantity: item.quantity ?? 1,
          priceAtMoment,
          listPrice,
          discountAmount: discountAmount,
          discountReason: item.discountReason,
          bundleId: item.bundleId,
          promotionId: promotionId,
          manualDiscountAmount,
          isReturned: false,
        };

        validateDiscountPolicy(saleItem);

        if (saleItem.discountAmount > 0) {
          discountsApplied.push({
            id: crypto.randomUUID(),
            tenantId,
            operationId: String(operationId),
            saleId: specificData.id,
            saleItemId: saleItem.id,
            amount: saleItem.discountAmount,
            reason: saleItem.promotionId ? "PROMOTION" : "MANUAL",
            promotionId: saleItem.promotionId || null,
            description: saleItem.discountReason || "Descuento en producto",
            createdAt: now,
          });
        }

        return saleItem;
      });
    }


    await this.saleRepo.addSale(specificData, saleItems, discountsApplied);

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
