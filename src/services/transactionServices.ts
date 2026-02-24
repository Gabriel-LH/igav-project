import { RentalDTO } from "../interfaces/RentalDTO";
import { ReservationDTO } from "../interfaces/reservationDTO";
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

function getFinancials(
  dto:
    | SaleDTO
    | RentalDTO
    | ReservationDTO
    | RentalFromReservationDTO
    | SaleFromReservationDTO,
) {
  if (dto.type === "venta") {
    return {
      totalAmount: dto.financials.totalAmount,
      paymentMethod: dto.financials.paymentMethod,
      downPayment: dto.financials.receivedAmount ?? 0,
      receivedAmount: dto.financials.receivedAmount ?? 0,
      keepAsCredit: dto.financials.keepAsCredit ?? false,
    };
  }

  if (dto.type === "reserva") {
    return {
      totalAmount: dto.financials.totalPrice,
      downPayment: dto.financials.downPayment,
      paymentMethod: dto.financials.paymentMethod,
      receivedAmount:
        dto.financials.receivedAmount ?? dto.financials.downPayment,
      keepAsCredit: dto.financials.keepAsCredit ?? false,
    };
  }

  // alquiler
  return {
    totalAmount: dto.financials.totalRent,
    downPayment: dto.financials.totalRent,
    paymentMethod: dto.financials.paymentMethod,
    receivedAmount: dto.financials.receivedAmount ?? dto.financials.totalRent,
    keepAsCredit: dto.financials.keepAsCredit ?? false,
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

export function processTransaction(
  dto:
    | SaleDTO
    | RentalDTO
    | ReservationDTO
    | RentalFromReservationDTO
    | SaleFromReservationDTO,
) {
  const now = new Date();
  const operationId = `OP-${Math.random()
    .toString(36)
    .toUpperCase()
    .substring(2, 9)}`;
  const gId = `GUA-${Math.random().toString(36).toUpperCase().substring(2, 9)}`;
  const rentalId = `RENT-${operationId}`;

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

  // 1. Crédito (Vuelto del pago inicial)
  if (overpayment > 0 && keepAsCredit) {
    addClientCredit(
      dto.customerId,
      overpayment,
      "overpayment",
      String(operationId),
    );
  }

  // 1️⃣ OPERACIÓN MADRE

  const initialNetPaid = downPayment > 0 ? downPayment : 0;
  const operationPaymentStatus = calculateOperationPaymentStatus(
    totalAmount,
    initialNetPaid,
  );
  const operationData = operationSchema.parse({
    id: String(operationId),
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
            discountAmount: 0,
            // productName: reservationItem.productName,
            // variantCode: reservationItem.variantCode,
            // serialCode: reservationItem.serialCode,
            // isSerial: reservationItem.isSerial,
            restockingFee: 0,
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
          discountAmount: 0,
          restockingFee: 0,
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
          dto.financials.totalPrice /
            dto.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
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
      dto.financials.guarantee &&
      dto.financials.guarantee.type !== "no_aplica"
    ) {
      guaranteeData = guaranteeSchema.parse({
        id: gId,
        operationId: String(operationId),
        branchId: dto.branchId,
        receivedById: dto.sellerId,
        type: dto.financials.guarantee.type,
        value: dto.financials.guarantee.value || "",
        description:
          dto.financials.guarantee.description || "Garantía de alquiler",
        status:
          dto.financials.guarantee.type === "por_cobrar"
            ? "pendiente"
            : "custodia",
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
      id: rentalId,
      operationId: String(operationId),
      reservationId: fromReservation ? dto.reservationId : undefined,
      customerId: dto.customerId,
      branchId: dto.branchId,
      outDate: dto.startDate,
      expectedReturnDate: dto.endDate,
      status: dto.status,
      guaranteeId: guaranteeData ? guaranteeData.id : undefined,
      totalPenalty: 0,
      createdAt: now,
      updatedAt: now,
      notes: !fromReservation ? (dto.notes ?? "") : "",
    });

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
              id: `RITEM-${item.reservationItemId}`,
              rentalId,
              operationId: String(operationId),
              productId: reservationItem.productId,
              stockId: item.stockId,
              quantity: reservationItem.quantity ?? 1,
              sizeId: reservationItem.sizeId,
              colorId: reservationItem.colorId,
              priceAtMoment: dto.financials.totalRent,
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
            priceAtMoment: item.priceAtMoment ?? dto.financials.totalRent, // Mejor precio unitario si existe
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
  if (downPayment > 0) {
    const pointsEarned = Math.floor(downPayment / 10);
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
  return {
    operation: operationData,
    payment: paymentData,
    details: specificData,
    guarantee: guaranteeData,
  };
}
