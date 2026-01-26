import { RentalDTO } from "../interfaces/RentalDTO";
import { ReservationDTO } from "../interfaces/ReservationDTO"; 
import { SaleDTO } from "../interfaces/SaleDTO";
import { useGuaranteeStore } from "../store/useGuaranteeStore";
import { useInventoryStore } from "../store/useInventoryStore";
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

function getFinancials(dto: SaleDTO | RentalDTO | ReservationDTO) {
  if (dto.type === "venta") {
    return {
      totalAmount: dto.totalPrice,
      downPayment: dto.totalPrice,
      paymentMethod: dto.paymentMethod,
      receivedAmount: dto.totalPrice,
      keepAsCredit: false,
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

// Firma correcta (sin any)
export function processTransaction(dto: SaleDTO | RentalDTO | ReservationDTO) {
  const now = new Date();
  const operationId = `OP-${Math.random().toString(36).toUpperCase().substring(2, 9)}`;
  const gId = `GUA-${Math.random().toString(36).toUpperCase().substring(2, 9)}`;
  const rentalId = `RENT-${operationId}`;

  const {
    totalAmount,
    downPayment,
    paymentMethod,
    receivedAmount,
    keepAsCredit,
  } = getFinancials(dto);

  const overpayment =
    receivedAmount > downPayment ? receivedAmount - downPayment : 0;

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
  const operationData = operationSchema.parse({
    id: String(operationId),
    branchId: dto.branchId,
    sellerId: dto.sellerId,
    customerId: dto.customerId,
    type: dto.type,
    status: "en_progreso",
    paymentStatus: totalAmount - downPayment <= 0 ? "pagado" : "parcial",
    totalAmount,
    date: now,
    createdAt: now,
  });

  useOperationStore.getState().addOperation(operationData);

  // 2️⃣ PAGO INICIAL
  const paymentData = paymentSchema.parse({
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

  // 3️⃣ LÓGICA POR TIPO
  if (dto.type === "venta") {
    specificData = saleSchema.parse({
      id: `SALE-${operationId}`,
      operationId: String(operationId),
      customerId: dto.customerId,
      totalAmount: dto.totalPrice,
      saleDate: now,
      status: "completado",
    });

    useInventoryStore.getState().updateStockStatus(dto.stockId, "vendido");
  }

  if (dto.type === "reserva") {
    const reservation = reservationSchema.parse({
      id: `RES-${operationId}`,
      operationId,
      branchId: dto.branchId,
      customerId: dto.customerId,
      productId: dto.productId,
      stockId: dto.stockId,
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
        productId: dto.productId,
        stockId: dto.stockId,
        quantity: dto.quantity ?? 1,
        size: dto.size,
        color: dto.color,
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
        value: Number(dto.financials.guarantee.value) || 0,
        description:
          dto.financials.guarantee.description || "Garantía de alquiler",
        status: "custodia",
        createdAt: now,
      });

      useGuaranteeStore.getState().addGuarantee(guaranteeData);
    }

    specificData = rentalSchema.parse({
      id: `RENT-${operationId}`,
      operationId: String(operationId),

      customerId: dto.customerId,
      branchId: dto.branchId,

      outDate: dto.startDate,
      expectedReturnDate: dto.endDate,

      status: "en_curso",
      guaranteeId: guaranteeData?.id,

      createdAt: now,
      updatedAt: now,
    });

    const rental = rentalSchema.parse({
      id: rentalId,
      operationId: String(operationId),
      reservationId: dto.id,
      customerId: dto.customerId,
      branchId: dto.branchId,
      outDate: dto.startDate,
      expectedReturnDate: dto.endDate,
      status: "en_curso",
      guaranteeId: guaranteeData ? guaranteeData.id : null,
      totalPenalty: 0,
      createdAt: now,
      updatedAt: now,
      notes: dto.notes ?? "",
    });

    const rentalItems = rentalItemSchema.array().parse([
      {
        id: `RITEM-${operationId}`,
        rentalId,
        operationId: String(operationId),
        productId: dto.productId,
        stockId: dto.stockId,
        size: dto.size,
        color: dto.color,
        priceAtMoment: dto.financials.totalRent,
        quantity: dto.quantity ?? 1,
        conditionOut: "Excelente",
        itemStatus: "alquilado",
        notes: dto.notes ?? "",
      },
    ]);

    useRentalStore.getState().createDirectRental(rental, rentalItems);

    useInventoryStore.getState().updateStockStatus(dto.stockId, "alquilado");
  }

  return {
    operation: operationData,
    payment: paymentData,
    details: specificData,
    guarantee: guaranteeData,
  };
}
