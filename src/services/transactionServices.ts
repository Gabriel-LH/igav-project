import { RentalDTO } from "../interfaces/RentalDTO";
import { ReservationDTO } from "../interfaces/ReservationDTO";
import { SaleDTO } from "../interfaces/SaleDTO";
import { useGuaranteeStore } from "../store/useGuaranteeStore";
import { useInventoryStore } from "../store/useInventoryStore";
import { InventoryItemStatus } from "../utils/status-type/InventoryItemStatusType";
import { useRentalStore } from "../store/useRentalStore";
import { guaranteeSchema } from "../types/guarantee/type.guarantee";
import { operationSchema } from "../types/operation/type.operations";
import { paymentSchema } from "../types/payments/type.payments";
import { rentalSchema } from "../types/rentals/type.rentals";
import { reservationSchema } from "../types/reservation/type.reservation";
import { saleSchema } from "../types/sales/type.sale";
import { rentalItemSchema } from "../types/rentals/type.rentalsItem";
import { useReservationStore } from "../store/useReservationStore";
import { reservationItemSchema } from "../types/reservation/type.reservationItem";
import { usePaymentStore } from "../store/usePaymentStore";
import { useOperationStore } from "../store/useOperationStore";
import { RentalFromReservationDTO } from "../interfaces/RentalFromReservationDTO";
import { SaleFromReservationDTO } from "../interfaces/SaleFromReservationDTO";
import { useSaleStore } from "../store/useSaleStore";
import { calculateOperationPaymentStatus } from "../utils/payment-helpers";
import { manageLoyaltyPoints } from "./use-cases/manageLoyaltyPoints";
import { addClientCredit } from "./use-cases/addClientCredit.usecase";
import { generateOperationReference } from "../utils/operation/generateOperationReference";
import { processReferrals } from "./use-cases/processReferrals";

function getFinancials(
  dto:
    | SaleDTO
    | RentalDTO
    | ReservationDTO
    | RentalFromReservationDTO
    | SaleFromReservationDTO,
) {
  const keepAsCredit = dto.financials.keepAsCredit ?? false;

  if (dto.type === "venta") {
    return {
      totalAmount: dto.financials.totalAmount,
      paymentMethod: dto.financials.paymentMethod,
      downPayment: dto.financials.receivedAmount ?? 0,
      receivedAmount: dto.financials.receivedAmount ?? 0,
      keepAsCredit,
    };
  }

  if (dto.type === "reserva") {
    return {
      totalAmount: dto.financials.totalAmount,
      downPayment: dto.financials.receivedAmount ?? 0,
      paymentMethod: dto.financials.paymentMethod,
      receivedAmount: dto.financials.receivedAmount ?? 0,
      keepAsCredit,
    };
  }

  // alquiler
  return {
    totalAmount: dto.financials.totalAmount,
    downPayment: dto.financials.receivedAmount ?? 0,
    paymentMethod: dto.financials.paymentMethod,
    receivedAmount: dto.financials.receivedAmount ?? 0,
    keepAsCredit,
  };
}

function isRentalFromReservation(
  dto: RentalDTO | RentalFromReservationDTO,
): dto is RentalFromReservationDTO {
  return (
    dto.type === "alquiler" &&
    "reservationId" in dto &&
    Array.isArray((dto as any).reservationItems)
  );
}

function isSaleFromReservation(
  dto: SaleDTO | SaleFromReservationDTO,
): dto is SaleFromReservationDTO {
  return (
    dto.type === "venta" &&
    "reservationId" in dto &&
    Array.isArray((dto as any).reservationItems)
  );
}

function resolveTenantId(
  dto:
    | SaleDTO
    | RentalDTO
    | ReservationDTO
    | RentalFromReservationDTO
    | SaleFromReservationDTO,
): string {
  if ((dto as any).tenantId) return (dto as any).tenantId as string;

  const inventoryStore = useInventoryStore.getState();

  if ("items" in dto && Array.isArray((dto as any).items)) {
    const firstItem = (dto as any).items.find((i: any) => i?.productId);
    if (firstItem?.productId) {
      const product = inventoryStore.products.find(
        (p) => p.id === firstItem.productId,
      );
      if (product?.tenantId) return product.tenantId;
    }
  }

  if (
    "reservationItems" in dto &&
    Array.isArray((dto as any).reservationItems) &&
    (dto as any).reservationItems.length > 0
  ) {
    const firstStockId = (dto as any).reservationItems[0]?.stockId;
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

export function processTransaction(
  dto:
    | SaleDTO
    | RentalDTO
    | ReservationDTO
    | RentalFromReservationDTO
    | SaleFromReservationDTO,
) {
  const now = new Date();
  const tenantId = resolveTenantId(dto);
  const operations = useOperationStore.getState().operations;

  const todayString = now.toISOString().split("T")[0];

  const todayOperationsByType = operations.filter(
    (op) =>
      op.type === dto.type &&
      op.date.toISOString().split("T")[0] === todayString,
  );

  const sequence = todayOperationsByType.length + 1;

  const referenceCode = generateOperationReference(dto.type, now, sequence);
  const reservationStore = useReservationStore.getState();

  const {
    totalAmount,
    downPayment,
    paymentMethod,
    receivedAmount,
    keepAsCredit,
  } = getFinancials(dto);

  const overpayment =
    receivedAmount > totalAmount ? receivedAmount - totalAmount : 0;

  let specificData: any = {};
  let guaranteeData: any = null;

  // 1️⃣ OPERACIÓN MADRE

  const initialNetPaid = downPayment > 0 ? downPayment : 0;
  const operationPaymentStatus = calculateOperationPaymentStatus(
    totalAmount,
    initialNetPaid,
  );
  const operationData = operationSchema.parse({
    id: crypto.randomUUID(),
    referenceCode,
    branchId: dto.branchId,
    sellerId: dto.sellerId,
    customerId: dto.customerId,
    type: dto.type,
    status: "en_progreso",
    paymentStatus: operationPaymentStatus,
    totalAmount,
    date: now,
    createdAt: now,
  });

  useOperationStore.getState().addOperation(operationData);

  const operationId = operationData.id;

  // Crédito (Vuelto del pago inicial)
  if (overpayment > 0 && keepAsCredit) {
    addClientCredit(
      dto.customerId,
      overpayment,
      "overpayment",
      String(operationId),
    );
  }

  let paymentData: any = null;
  // 2️⃣ PAGO INICIAL (solo si hay algo que pagar)
  if (downPayment > 0) {
    paymentData = paymentSchema.parse({
      id: `PAY-${Math.random().toString(36).toUpperCase().substring(2, 9)}`,
      operationId: String(operationId),
      branchId: dto.branchId,
      receivedById: dto.sellerId,
      amount: downPayment,
      direction: "in",
      method: paymentMethod,
      status: "posted",
      category: "payment",
      date: now,
    });

    usePaymentStore.getState().addPayment(paymentData);
  }
  // ==========================================
  // 3️⃣ LÓGICA POR TIPO
  // ==========================================

  // ---------------- VENTA -------------------
  if (dto.type === "venta") {
    const fromReservation = isSaleFromReservation(dto);

    specificData = saleSchema.parse({
      id: `SALE-${operationId}`,
      tenantId,
      operationId: String(operationId),
      customerId: dto.customerId,
      reservationId: fromReservation ? dto.reservationId : undefined,
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

    // CORRECCIÓN: Manejo unificado de items
    const saleItems = fromReservation
      ? dto.reservationItems.map((item) => {
          const reservationItem = reservationStore.reservationItems.find(
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
        })
      : (dto as SaleDTO).items.map((item) => ({
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

    useSaleStore.getState().addSale(specificData, saleItems);

    // 🔥 MODIFICACIÓN DE ESTADO DE STOCK (V2 - SOPORTE HÍBRIDO)
    saleItems.forEach((item) => {
      const inventoryStore = useInventoryStore.getState();
      let finalStockStatus: InventoryItemStatus = "vendido";

      // 1. Mapeo de estados: Venta -> Stock
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

      // 2. Detectamos si es Serial o Lote
      const isSerial = inventoryStore.inventoryItems.some(
        (i) => i.id === item.stockId,
      );

      if (isSerial) {
        // CASO SERIAL: Actualizamos estado y ubicación
        inventoryStore.updateItemStatus(
          item.stockId,
          finalStockStatus,
          dto.branchId,
          dto.sellerId,
        );
      } else {
        // CASO LOTE: Descontamos cantidad
        // Solo restamos si la venta se concreta o se entrega.
        if (
          finalStockStatus === "vendido" ||
          finalStockStatus === "vendido_pendiente_entrega"
        ) {
          inventoryStore.decreaseLotQuantity(item.stockId, item.quantity);
        } else if (finalStockStatus === "reservado") {
          // Si es reserva de lote, por ahora no descontamos (la lógica de reserva de lotes suele ser distinta)
          // Pero podríamos marcar el lote o simplemente dejarlo así si el sistema no maneja "apartados" en lotes aún.
        }
      }
    });
  }
  // ---------------- RESERVA -------------------
  if (dto.type === "reserva") {
    const totalUnits = dto.items.reduce((acc, i) => acc + (i.quantity || 1), 0);

    const reservation = reservationSchema.parse({
      id: `RES-${operationId}`,
      operationId,
      branchId: dto.branchId,
      customerId: dto.customerId,
      productId: dto.items[0].productId,
      stockId: dto.items[0].stockId, // OJO: En reserva múltiple esto podría requerir ajuste futuro
      operationType: dto.operationType,
      startDate: dto.reservationDateRange.from,
      endDate: dto.reservationDateRange.to,
      hour: dto.reservationDateRange.hourFrom,
      status: "confirmada",
      notes: dto.notes ?? "",
      createdAt: now,
      updatedAt: now,
    });

    // Mapeamos todos los items de la reserva
    const reservationItems = reservationItemSchema.array().parse(
      dto.items.map((item) => ({
        id: `RITEM-${Math.random().toString(36).substring(2, 9)}`, // ID único
        operationId: String(operationId),
        reservationId: reservation.id,
        productId: item.productId,
        stockId: item.stockId,
        quantity: item.quantity ?? 1,
        sizeId: item.sizeId,
        colorId: item.colorId,
        // CORRECCIÓN: Usar precio unitario si existe en el item, o calcularlo proporcionalmente
        priceAtMoment:
          item.priceAtMoment ||
          (totalUnits > 0 ? dto.financials.totalAmount / totalUnits : 0),
        listPrice: item.listPrice,
        discountAmount: item.discountAmount ?? 0,
        discountReason: item.discountReason,
        bundleId: item.bundleId,
        promotionId: item.promotionId,
        itemStatus: "confirmada",
        notes: dto.notes ?? "",
      })),
    );

    useReservationStore
      .getState()
      .addReservation(reservation, reservationItems);

    // 🔴 BUG FIX: Actualizar estado del stock a "reservado"
    reservationItems.forEach((item) => {
      if (item.stockId) {
        const inventoryStore = useInventoryStore.getState();
        const isSerial = inventoryStore.inventoryItems.some(
          (i) => i.id === item.stockId,
        );

        if (isSerial) {
          inventoryStore.updateItemStatus(item.stockId, "reservado");
        } else {
          // Reservas de lotes: Generalmente se manejan con un campo de "comprometido"
          // o simplemente no se descuentan hasta la venta.
          // Por ahora, el store no tiene un 'reserveLotQuantity', así que lo omitimos o registramos log.
        }
      }
    });

    specificData = reservation;
  }

  // ---------------- ALQUILER -------------------
  if (dto.type === "alquiler") {
    const fromReservation = isRentalFromReservation(dto);

    // Garantía
    if (
      !fromReservation &&
      dto.guarantee &&
      dto.guarantee.type !== "no_aplica"
    ) {
      guaranteeData = guaranteeSchema.parse({
        id: crypto.randomUUID(),
        operationId: String(operationId),
        branchId: dto.branchId,
        receivedById: dto.sellerId,
        type: dto.guarantee.type,
        value: dto.guarantee.value || "",
        description: dto.guarantee.description || "Garantía de alquiler",
        status: dto.guarantee.type === "por_cobrar" ? "pendiente" : "custodia",
        createdAt: now,
      });

      useGuaranteeStore.getState().addGuarantee(guaranteeData);
    }

    // Convertir Reserva
    if (fromReservation) {
      const reservationStore = useReservationStore.getState();
      reservationStore.updateStatus(
        dto.reservationId,
        "alquiler",
        "convertida",
      );
      dto.reservationItems.forEach((item) => {
        reservationStore.updateReservationItemStatus(
          item.reservationItemId,
          "convertida",
        );
      });
    }

    const rental = rentalSchema.parse({
      id: crypto.randomUUID(),
      tenantId,
      operationId: String(operationId),
      reservationId: fromReservation ? dto.reservationId : undefined,
      customerId: dto.customerId,
      branchId: dto.branchId,
      outDate: dto.startDate,
      expectedReturnDate: dto.endDate,
      status: dto.status,
      guaranteeId: guaranteeData ? guaranteeData.id : undefined,
      createdAt: now,
      updatedAt: now,
      notes: !fromReservation ? (dto.notes ?? "") : "",
    });

    const rentalId = rental.id;

    // CORRECCIÓN: Mapeo masivo de items para alquiler directo
    const rentalItems = fromReservation
      ? rentalItemSchema.array().parse(
          dto.reservationItems.map((item) => {
            const reservationItem = reservationStore.reservationItems.find(
              (ri) => ri.id === item.reservationItemId,
            );
            if (!reservationItem)
              throw new Error(`ReservationItem no encontrado`);

            return {
              id: crypto.randomUUID(),
              rentalId,
              operationId: String(operationId),
              productId: reservationItem.productId,
              stockId: item.stockId,
              quantity: reservationItem.quantity ?? 1,
              sizeId: reservationItem.sizeId,
              colorId: reservationItem.colorId,
              priceAtMoment: reservationItem.priceAtMoment,
              listPrice: reservationItem.listPrice,
              discountAmount: reservationItem.discountAmount ?? 0,
              discountReason: reservationItem.discountReason,
              bundleId: reservationItem.bundleId,
              promotionId: reservationItem.promotionId,
              conditionOut: "Excelente",
              itemStatus: "alquilado",
              notes: "",
            };
          }),
        )
      : rentalItemSchema.array().parse(
          (dto as RentalDTO).items.map((item) => ({
            id: `RITEM-${Math.random().toString(36).substring(2, 9)}`,
            rentalId,
            operationId: String(operationId),
            productId: item.productId,
            stockId: item.stockId,
            quantity: item.quantity ?? 1, // Típicamente 1 por línea
            sizeId: item.sizeId,
            colorId: item.colorId,
            priceAtMoment: item.priceAtMoment ?? 0, // Mejor precio unitario si existe
            listPrice: item.listPrice,
            discountAmount: item.discountAmount ?? 0,
            discountReason: item.discountReason,
            bundleId: item.bundleId,
            promotionId: item.promotionId,
            conditionOut: "Excelente",
            itemStatus: "alquilado",
            notes: (dto as any).notes ?? "",
          })),
        );

    useRentalStore.getState().addRental(rental, rentalItems);

    // 🔄 Inventario (Para TODOS los items)
    const finalRentalStockStatus =
      dto.status === "reservado_fisico" ? "reservado_fisico" : "alquilado";

    rentalItems.forEach((item) => {
      const inventoryStore = useInventoryStore.getState();
      const isSerial = inventoryStore.inventoryItems.some(
        (i) => i.id === item.stockId,
      );

      if (isSerial) {
        inventoryStore.updateItemStatus(
          item.stockId,
          finalRentalStockStatus as InventoryItemStatus,
          dto.branchId,
          dto.sellerId,
        );
      } else {
        // Si es alquiler de lote (poco común pero posible para accesorios)
        // Descontamos la cantidad mientras esté fuera.
        inventoryStore.decreaseLotQuantity(item.stockId, item.quantity);
      }
    });

    specificData = rental;
  }

  // 2. 🌟 Lógica de Puntos por el pago inicial
  // Usamos downPayment (lo que amortizó hoy) para darle puntos
  const actualPaidForPoints = Math.min(downPayment, totalAmount);
  if (actualPaidForPoints > 0) {
    const pointsEarned = Math.floor(actualPaidForPoints / 10);
    if (pointsEarned > 0) {
      manageLoyaltyPoints({
        clientId: dto.customerId,
        points: pointsEarned,
        type: "earned_purchase",
        operationId: String(operationId),
        description: `Puntos por pago inicial de ${dto.type}`,
      });
    }
  }

  // 3. 🌟 Referral logic (if this is their first purchase or they have a pending referral)
  // Get tenantId safely (some DTOs like SaleFromReservationDTO don't have items array)
  // Rely on the outer-scoped tenantId that was already resolved at the top of the function

  if (tenantId && tenantId !== "UNKNOWN_TENANT") {
    // Assuming this might be their first purchase, pass first_purchase trigger
    processReferrals(dto.customerId, tenantId, "first_purchase");
  }

  return {
    operation: operationData,
    payment: paymentData,
    details: specificData,
    guarantee: guaranteeData,
  };
}
