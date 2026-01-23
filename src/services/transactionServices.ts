import { RentalDTO } from "../interfaces/RentalDTO";
import { ReservationDTO } from "../interfaces/reservationDTO";
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

// 1. Firmas de la función (Overloads)
export function processTransaction(dto: SaleDTO): any;
export function processTransaction(dto: RentalDTO): any;
export function processTransaction(dto: ReservationDTO): any;

// 2. Implementación Única
export function processTransaction(dto: any) {
  const now = new Date();
  const operationId = Math.floor(Math.random() * 1000000);
  
  // Pequeño helper para extraer datos financieros según el DTO
  // En SaleDTO es dto.totalPrice, en los otros es dto.financials.total
  const totalAmount = dto.type === "venta" ? dto.totalPrice : dto.financials.total;
  const downPayment = dto.type === "venta" ? dto.totalPrice : dto.financials.downPayment;
  const paymentMethod = dto.type === "venta" ? dto.paymentMethod : dto.financials.paymentMethod;

  const isFuture = dto.type === "reserva" || (dto.type === "alquiler" && dto.startDate > now);

  let specificData: any = {};
  let guaranteeData: any = null;
  const gId = `GUA-${operationId}`;

  // 2. CREAR OPERACIÓN MADRE
  const operationData = operationSchema.parse({
    id: operationId,
    branchId: dto.branchId,
    sellerId: dto.sellerId,
    customerId: dto.customerId,
    type: dto.type,
    status: "en_progreso",
    paymentStatus: (totalAmount - downPayment) <= 0 ? "pagado" : "parcial",
    totalAmount: totalAmount,
    date: now,
    createdAt: now,
  });

  // 3. CREAR PAGO INICIAL
  const paymentData = paymentSchema.parse({
    id: `PAY-${Math.random().toString(36).toUpperCase().substring(2, 9)}`,
    operationId,
    branchId: dto.branchId,
    receivedById: dto.sellerId,
    amount: downPayment,
    method: paymentMethod,
    type: dto.type === "reserva" ? "adelanto" : "pago_total",
    date: now,
  });

  // 4. LÓGICA DE NEGOCIO SEGÚN TIPO
  if (dto.type === "venta") {
    specificData = saleSchema.parse({
      id: `SALE-${operationId}`,
      operationId,
      customerId: dto.customerId,
      totalAmount: dto.totalPrice,
      saleDate: now,
      status: "completado",
    });
    
    useInventoryStore.getState().updateStockStatus(dto.stockId, "vendido");

  } else if (dto.type === "reserva") {
    specificData = reservationSchema.parse({
      id: `RES-${operationId}`,
      customerId: dto.customerId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: "confirmada",
    });
    // Aquí podrías actualizar el stock a "reservado" si tuvieras ese estado

  } else if (dto.type === "alquiler") {
    specificData = rentalSchema.parse({
      id: `RENT-${operationId}`,
      operationId,
      outDate: dto.startDate,
      expectedReturnDate: dto.endDate,
      status: "en_curso",
      guaranteeId: gId,
    });

    // Lógica de Garantía (Solo existe en Alquiler)
    if (dto.guarantee && dto.guarantee.type !== "no_aplica") {
      guaranteeData = guaranteeSchema.parse({
        id: gId,
        operationId,
        type: dto.guarantee.type,
        value: Number(dto.guarantee.value) || 0,
        description: dto.guarantee.description || "Garantía de alquiler",
        status: "custodia",
        createdAt: now,
      });
      
      useGuaranteeStore.getState().addGuarantee(guaranteeData);
    }

    useRentalStore.getState().createDirectRental({
        ...dto,
        guarantee: { ...dto.guarantee, id: gId }
    });
    
    useInventoryStore.getState().updateStockStatus(dto.stockId, "alquilado");
  }

  return {
    operation: operationData,
    payment: paymentData,
    details: specificData,
    guarantee: guaranteeData,
  };
}