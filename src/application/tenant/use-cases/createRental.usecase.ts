import { RentalRepository } from "../../../domain/tenant/repositories/RentalRepository";
import { ReservationRepository } from "../../../domain/tenant/repositories/ReservationRepository";
import { GuaranteeRepository } from "../../../domain/tenant/repositories/GuaranteeRepository";
import { InventoryRepository } from "../../../domain/tenant/repositories/InventoryRepository";
import { RentalDTO } from "../../dtos/RentalDTO";
import { RentalFromReservationDTO } from "../../dtos/RentalFromReservationDTO";
import { rentalSchema } from "../../../types/rentals/type.rentals";
import { rentalItemSchema } from "../../../types/rentals/type.rentalsItem";
import { guaranteeSchema } from "../../../types/guarantee/type.guarantee";
import { InventoryItemStatus } from "../../../utils/status-type/InventoryItemStatusType";
import { DEFAULT_TENANT_POLICY_SECTIONS } from "@/src/lib/tenant-defaults";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";

export class CreateRentalUseCase {
  constructor(
    private rentalRepo: RentalRepository,
    private reservationRepo: ReservationRepository,
    private guaranteeRepo: GuaranteeRepository,
    private inventoryRepo: InventoryRepository,
  ) {}

  async execute(
    dto: RentalDTO | RentalFromReservationDTO,
    operationId: string,
    tenantId: string,
  ): Promise<any> {
    const now = new Date();
    const fromReservation =
      "reservationId" in dto && Array.isArray((dto as any).reservationItems);

    const policySnapshot = (dto as any).policySnapshot as TenantPolicy | undefined;
    const policy: TenantPolicy = {
      ...(DEFAULT_TENANT_POLICY_SECTIONS as TenantPolicy),
      ...(policySnapshot ?? {}),
      id: "policy-default",
      tenantId,
      version: 1,
      isActive: true,
      createdAt: new Date(0),
      updatedBy: "system",
      rentals: {
        ...(DEFAULT_TENANT_POLICY_SECTIONS as TenantPolicy).rentals,
        ...(policySnapshot?.rentals ?? {}),
      },
    };

    if (
      !fromReservation &&
      policy.rentals?.requireGuarantee &&
      (!(dto as RentalDTO).guarantee ||
        (dto as RentalDTO).guarantee?.type === "no_aplica")
    ) {
      throw new Error("La política requiere garantía para alquileres.");
    }

    let guaranteeData: any = null;

    if (
      !fromReservation &&
      (dto as RentalDTO).guarantee &&
      (dto as RentalDTO).guarantee?.type !== "no_aplica"
    ) {
      guaranteeData = guaranteeSchema.parse({
        id: crypto.randomUUID(),
        tenantId,
        operationId: String(operationId),
        branchId: dto.branchId,
        receivedById: dto.sellerId,
        type: (dto as RentalDTO).guarantee?.type,
        value: (dto as RentalDTO).guarantee?.value || "",
        description:
          (dto as RentalDTO).guarantee?.description || "Garantía de alquiler",
        status:
          (dto as RentalDTO).guarantee?.type === "por_cobrar"
            ? "pendiente"
            : "custodia",
        createdAt: now,
      });

      await this.guaranteeRepo.addGuarantee(guaranteeData);
    }

    if (fromReservation) {
      await this.reservationRepo.updateStatus(
        (dto as RentalFromReservationDTO).reservationId,
        "convertida",
        "convertida",
      );
      for (const item of (dto as RentalFromReservationDTO).reservationItems) {
        await this.reservationRepo.updateReservationItemStatus(
          item.reservationItemId,
          "convertida",
        );
      }
    }

    const rental = rentalSchema.parse({
      id: crypto.randomUUID(),
      tenantId,
      operationId: String(operationId),
      reservationId: fromReservation
        ? (dto as RentalFromReservationDTO).reservationId
        : undefined,
      customerId: dto.customerId,
      branchId: dto.branchId,
      outDate: dto.startDate,
      expectedReturnDate: dto.endDate,
      subTotal: dto.financials?.subtotal,
      totalDiscount: dto.financials?.totalDiscount,
      status: dto.status,
      guaranteeId: guaranteeData ? guaranteeData.id : undefined,
      createdAt: now,
      updatedAt: now,
      notes: !fromReservation ? ((dto as RentalDTO).notes ?? "") : "",
    });

    const discountsApplied: any[] = [];

    const tenantConfig = (dto as any).configSnapshot || {};
    const allowStacking = tenantConfig.pricing?.allowDiscountStacking ?? true;

    const validateDiscountPolicy = (item: any) => {
      const hasPromo = Boolean(item.promotionId || item.bundleId);
      const hasManual = (item.discountAmount ?? 0) > 0;
      const hasExtraDiscount = (dto.financials as any).extraDiscountTotal > 0;

      if (!allowStacking) {
        if (hasPromo && hasManual) {
          throw new Error("La política actual no permite acumular promociones con descuentos manuales en el alquiler.");
        }
        if (hasExtraDiscount && (hasPromo || hasManual)) {
          throw new Error("La política actual no permite acumular cupones o puntos con descuentos en productos de alquiler.");
        }
      }
    };

    let rentalItems: any[] = [];

    if (fromReservation) {
      const reservationItemsData = await this.reservationRepo.getReservationItems();
      rentalItems = rentalItemSchema.array().parse(
        (dto as RentalFromReservationDTO).reservationItems.map((item) => {
          const reservationItem = reservationItemsData.find(
            (ri) => ri.id === item.reservationItemId,
          );
          if (!reservationItem)
            throw new Error(`ReservationItem no encontrado`);
          const rItem = {
            id: crypto.randomUUID(),
            tenantId,
            rentalId: rental.id,
            operationId: String(operationId),
            productId: reservationItem.productId,
            stockId: item.stockId,
            quantity: reservationItem.quantity ?? 1,
            variantId: reservationItem.variantId,
            priceAtMoment: reservationItem.priceAtMoment,
            listPrice:
              reservationItem.listPrice ?? reservationItem.priceAtMoment,
            discountAmount: reservationItem.discountAmount ?? 0,
            discountReason: reservationItem.discountReason,
            bundleId: reservationItem.bundleId,
            promotionId: reservationItem.promotionId,
            conditionOut: "Excelente",
            itemStatus: "alquilado",
            notes: "",
          };
          validateDiscountPolicy(rItem);

          if (rItem.discountAmount > 0) {
            discountsApplied.push({
              id: crypto.randomUUID(),
              tenantId,
              operationId: String(operationId),
              rentalId: rental.id,
              rentalItemId: rItem.id,
              amount: rItem.discountAmount,
              reason: rItem.promotionId ? "PROMOTION" : "MANUAL",
              promotionId: rItem.promotionId || null,
              description: rItem.discountReason || "Descuento en producto",
              createdAt: now,
            });
          }

          return rItem;
        }),
      );
    } else {
      rentalItems = rentalItemSchema.array().parse(
        (dto as RentalDTO).items.map((item) => {
          // Correct mapping: CartItem (item) uses unitPrice, listPrice, discountAmount, etc.
          const unitPrice = item.unitPrice ?? (item as any).priceAtMoment ?? 0;
          const discountAmount = item.discountAmount ?? 0;
          const promotionId = item.appliedPromotionId ?? (item as any).promotionId;

          const rItem = {
            id: `RITEM-${Math.random().toString(36).substring(2, 9)}`,
            tenantId,
            rentalId: rental.id,
            operationId: String(operationId),
            productId: item.productId,
            stockId: item.inventoryItemId ?? item.stockId,
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity ?? 1,
            variantId: item.variantId,
            priceAtMoment: unitPrice,
            listPrice: (item.listPrice && item.listPrice > unitPrice)
              ? item.listPrice
              : (unitPrice + discountAmount),
            discountAmount: discountAmount,
            discountReason: item.discountReason,
            bundleId: item.bundleId,
            promotionId: promotionId,
            conditionOut: "Excelente",
            itemStatus: "alquilado",
            notes: (dto as any).notes ?? "",
          };
          validateDiscountPolicy(rItem);

          if (rItem.discountAmount > 0) {
            discountsApplied.push({
              id: crypto.randomUUID(),
              tenantId,
              operationId: String(operationId),
              rentalId: rental.id,
              rentalItemId: rItem.id,
              amount: rItem.discountAmount,
              reason: rItem.promotionId ? "PROMOTION" : "MANUAL",
              promotionId: rItem.promotionId || null,
              description: rItem.discountReason || "Descuento en producto",
              createdAt: now,
            });
          }

          return rItem;
        }),
      );
    }


    await this.rentalRepo.addRental(rental, rentalItems, discountsApplied);

    const finalRentalStockStatus: InventoryItemStatus =
      dto.status === "reservado_fisico" ||
      dto.status === "pendiente_entrega" ||
      dto.status === "reservado"
        ? "alquilado_pendiente_entrega"
        : "alquilado";

    for (const item of rentalItems) {
      if (await this.inventoryRepo.isSerial(item.stockId)) {
        await this.inventoryRepo.updateItemStatus(
          item.stockId,
          finalRentalStockStatus as InventoryItemStatus,
          dto.branchId,
          dto.sellerId,
        );
      } else {
        if (finalRentalStockStatus === "alquilado") {
          await this.inventoryRepo.decreaseLotQuantity(
            item.stockId,
            item.quantity,
          );
        }
      }
    }

    return { rental, guaranteeData };
  }
}
