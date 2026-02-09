import { RentalDTO } from "../interfaces/RentalDTO";
import { ReservationDTO } from "../interfaces/ReservationDTO";
import { SaleDTO } from "../interfaces/SaleDTO";
import { useGuaranteeStore } from "../store/useGuaranteeStore";
import { StockStatus, useInventoryStore } from "../store/useInventoryStore";
import { useRentalStore } from "../store/useRentalStore";
import { guaranteeSchema } from "../types/guarantee/type.guarantee";
import { operationSchema } from "../types/operation/type.operations";
import { paymentSchema } from "../types/payments/type.payments";
import { rentalSchema } from "../types/rentals/type.rentals";
import { reservationSchema } from "../types/reservation/type.reservation";
import { saleSchema } from "../types/sales/type.sale";
import { useClientCreditStore } from "../store/useClientCreditStore";
import { rentalItemSchema } from "../types/rentals/type.rentalsItem";
import { useReservationStore } from "../store/useReservationStore";
import { reservationItemSchema } from "../types/reservation/type.reservationItem";
import { usePaymentStore } from "../store/usePaymentStore";
import { useOperationStore } from "../store/useOperationStore";
import { RentalFromReservationDTO } from "../interfaces/RentalFromReservationDTO";
import { SaleFromReservationDTO } from "../interfaces/SaleFromReservationDTO";
import { useSaleStore } from "../store/useSaleStore";

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
      downPayment: dto.financials.downPayment ?? 0,
      receivedAmount: dto.financials.receivedAmount,
      keepAsCredit: dto.financials.keepAsCredit,
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

  if (overpayment > 0 && keepAsCredit) {
    useClientCreditStore.getState().addEntry({
      id: `CCL-${Math.random().toString(36).substring(2, 9)}`,
      clientId: dto.customerId,
      amount: overpayment,
      reason: "overpayment",
      operationId,
      createdAt: now,
    });
  }

  // 1️⃣ OPERACIÓN MADRE

  const isPaid = dto.type === "venta" && receivedAmount >= totalAmount;
  const operationData = operationSchema.parse({
    id: String(operationId),
    branchId: dto.branchId,
    sellerId: dto.sellerId,
    customerId: dto.customerId,
    type: dto.type,
    status: "en_progreso",
    paymentStatus: isPaid ? "pagado" : "parcial",
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
      method: paymentMethod,
      type: dto.type === "reserva" ? "adelanto" : "saldo_total",
      date: now,
    });

    usePaymentStore.getState().addPayment(paymentData);
  }
  // 3️⃣ LÓGICA POR TIPO
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

    const saleItems = fromReservation
      ? dto.reservationItems.map((item) => {
          const reservationItem = reservationStore.reservationItems.find(
            (ri) => ri.id === item.reservationItemId,
          );

          if (!reservationItem) {
            throw new Error(
              `ReservationItem no encontrado: ${item.reservationItemId}`,
            );
          }

          return {
            id: `SITEM-${item.reservationItemId}`,
            saleId: specificData.id,
            operationId: String(operationId),
            productId: reservationItem.productId,
            stockId: item.stockId,
            quantity: reservationItem.quantity ?? 1,
            priceAtMoment: reservationItem.priceAtMoment,
            restockingFee: 0,
            isReturned: false,
          };
        })
      : (dto as SaleDTO).items.map((item) => ({
          id: `SITEM-${Math.random().toString(36).substring(2, 9)}`,
          saleId: specificData.id,
          operationId: String(operationId),
          productId: item.productId,
          stockId: item.stockId,
          quantity: item.quantity ?? 1,
          priceAtMoment: item.priceAtMoment,
          restockingFee: 0,
          isReturned: false,
        }));

    useSaleStore.getState().addSale(specificData, saleItems);

    saleItems.forEach((item) => {
      // Si la venta nace como 'vendido', el stock es 'vendido'
      // Si la venta nace como 'pendiente_entrega', el stock es 'vendido_pendiente_entrega'
      const finalStockStatus =
        dto.status === "vendido" ? "vendido" : "vendido_pendiente_entrega";

      useInventoryStore
        .getState()
        .deliverAndTransfer(
          item.stockId,
          finalStockStatus as StockStatus,
          dto.branchId,
          dto.sellerId,
        );
    });
  }

  if (dto.type === "reserva") {
    const reservation = reservationSchema.parse({
      id: `RES-${operationId}`,
      operationId,
      branchId: dto.branchId,
      customerId: dto.customerId,
      productId: dto.items[0].productId,
      stockId: dto.items[0].stockId,
      operationType: dto.operationType,
      startDate: dto.reservationDateRange.from,
      endDate: dto.reservationDateRange.to,
      hour: new Date().toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "confirmada",
      notes: dto.notes ?? "",
      createdAt: now,
      updatedAt: now,
    });

    const reservationItems = reservationItemSchema.array().parse([
      {
        id: `RITEM-${operationId}`,
        operationId: String(operationId),
        reservationId: reservation.id,
        productId: dto.items[0].productId,
        stockId: dto.items[0].stockId,
        quantity: dto.items[0].quantity ?? 1,
        size: dto.items[0].size,
        color: dto.items[0].color,
        priceAtMoment: dto.financials.totalPrice,
        itemStatus: "confirmada",
        notes: dto.notes ?? "",
      },
    ]);

    useReservationStore
      .getState()
      .addReservation(reservation, reservationItems);

    specificData = reservation;
  }

  if (dto.type === "alquiler") {
    const fromReservation = isRentalFromReservation(dto);

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
        status: "custodia",
        createdAt: now,
      });

      useGuaranteeStore.getState().addGuarantee(guaranteeData);
    }

    // 🔁 Reserva → convertida (solo si viene de reserva)
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
      reservationId: fromReservation ? dto.reservationId : null,
      customerId: dto.customerId,
      branchId: dto.branchId,
      outDate: dto.startDate,
      expectedReturnDate: dto.endDate,
      status: "en_curso",
      guaranteeId: guaranteeData ? guaranteeData.id : null,
      totalPenalty: 0,
      createdAt: now,
      updatedAt: now,
      notes: !fromReservation ? (dto.notes ?? "") : "",
    });

    const rentalItems = fromReservation
      ? rentalItemSchema.array().parse(
          dto.reservationItems.map((item) => {
            const reservationItem = reservationStore.reservationItems.find(
              (ri) => ri.id === item.reservationItemId,
            );

            if (!reservationItem) {
              throw new Error(
                `ReservationItem no encontrado: ${item.reservationItemId}`,
              );
            }

            return {
              id: `RITEM-${item.reservationItemId}`,
              rentalId,
              operationId: String(operationId),
              productId: reservationItem.productId,
              stockId: item.stockId,
              quantity: reservationItem.quantity ?? 1,
              size: reservationItem.size,
              color: reservationItem.color,
              priceAtMoment: dto.financials.totalRent,
              conditionOut: "Excelente",
              itemStatus: "alquilado",
              notes: "",
            };
          }),
        )
      : rentalItemSchema.array().parse([
          {
            id: `RITEM-${operationId}`,
            rentalId,
            operationId: String(operationId),
            productId: dto.items[0].productId,
            stockId: dto.items[0].stockId,
            quantity: dto.items[0].quantity ?? 1,
            size: dto.items[0].size,
            color: dto.items[0].color,
            priceAtMoment: dto.financials.totalRent,
            conditionOut: "Excelente",
            itemStatus: "alquilado",
            notes: dto.notes ?? "",
          },
        ]);

    useRentalStore.getState().addRental(rental, rentalItems);

    // 🔄 Inventario
    if (fromReservation) {
      rentalItems.forEach((item) => {
        useInventoryStore
          .getState()
          .updateStockStatus(item.stockId, "alquilado");
      });
    } else {
      useInventoryStore
        .getState()
        .updateStockStatus(dto.items[0].stockId, "alquilado");
    }

    specificData = rental;
  }

  return {
    operation: operationData,
    payment: paymentData,
    details: specificData,
    guarantee: guaranteeData,
  };
}
