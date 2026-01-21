import { ReservationDTO } from "../interfaces/reservationDTO";
import { operationSchema } from "../types/operation/type.operations";
import { paymentSchema } from "../types/payments/type.payments";
import { saleSchema } from "../types/sales/type.sale";
import { rentalSchema } from "../types/rentals/type.rentals";
import { guaranteeSchema } from "../types/guarantee/type.guarantee";
import { reservationSchema } from "../types/reservation/type.reservation";

export const processTransaction = (dto: ReservationDTO) => {
  const now = new Date();
  const operationId = Math.floor(Math.random() * 1000000); // En DB sería autoincremental

  const isFuture = dto.startDate > now && dto.type === "alquiler";

  // 1. CREAR OPERACIÓN (La Madre)
  const operationData = operationSchema.parse({
    id: operationId,
    branchId: dto.branchId,
    sellerId: "user_actual_id", // Esto vendría de tu AuthStore
    customerId: dto.customerId,
    type: dto.type, // "alquiler", "venta" o "reserva"
    status: "en_progreso",
    paymentStatus: dto.financials.pendingAmount <= 0 ? "pagado" : "parcial",
    totalAmount: dto.financials.total,
    date: now,
    createdAt: now,
  });

  // 2. CREAR PAGO (El primer adelanto)
  const paymentData = paymentSchema.parse({
    id: `PAY-${Math.random().toString(36).toUpperCase()}`,
    operationId: operationId,
    branchId: dto.branchId,
    receivedById: dto.sellerId,
    amount: dto.financials.downPayment,
    method: dto.financials.paymentMethod,
    type: "adelanto",
    date: now,
  });

  // 3. REPARTO SEGÚN TIPO DE NEGOCIO
  let specificData = {};

  if (dto.type === "venta") {
    specificData = saleSchema.parse({
      id: `SALE-${operationId}`,
      operationId: operationId,
      customerId: dto.customerId,
      branchId: dto.branchId,
      sellerId: dto.sellerId,
      totalAmount: dto.financials.total,
      saleDate: now,
      status: "completado",
      createdAt: now,
    });
  } else if (isFuture) {
    return reservationSchema.parse({
      id: `RES-${Math.random().toString(36).toUpperCase()}`,
      customerId: dto.customerId,
      branchId: dto.branchId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      hour: "10:00 AM", // Podrías sacarlo del DTO si lo agregas
      status: "confirmada", // Status válido según tu reservationSchema
      createdAt: now,
      updatedAt: now,
    });
  } else {
    // Es Alquiler
    specificData = rentalSchema.parse({
      id: `RENT-${operationId}`,
      operationId: operationId,
      customerId: dto.customerId,
      branchId: dto.branchId,
      outDate: dto.startDate,
      expectedReturnDate: dto.endDate,
      status: dto.startDate <= now ? "en_curso" : "en_espera",
      guaranteeId: `GUA-${operationId}`,
      createdAt: now,
      updatedAt: now,
    });

    // Crear Garantía si aplica
    if (dto.financials.guarantee.type !== "no_aplica") {
      const guaranteeData = guaranteeSchema.parse({
        id: `GUA-${operationId}`,
        operationId: operationId,
        branchId: dto.branchId,
        type: dto.financials.guarantee.type,
        value: Number(dto.financials.guarantee.value) || 0,
        description: dto.notes || "Garantía de alquiler",
        status: "custodia",
        receivedById: "user_actual_id",
        createdAt: now,
      });
      console.log("Garantía creada:", guaranteeData);
    }
  }

  return {
    operation: operationData,
    payment: paymentData,
    details: specificData,
  };
};
