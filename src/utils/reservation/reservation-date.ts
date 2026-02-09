import { addDays, startOfDay } from "date-fns";
import { BusinessRules } from "@/src/types/bussines-rules/bussines-rules"; 
import { getEstimatedTransferTime } from "../transfer/get-estimated-transfer-time";
import { Reservation } from "@/src/types/reservation/type.reservation";
import { Payment } from "@/src/types/payments/type.payments";

export const getMinReservationDate = (
  originBranchId: string, 
  currentBranchId: string, 
  rules: BusinessRules
) => {
  const today = startOfDay(new Date());
  
  // Si el stock es local, podría estar disponible mañana (o hoy mismo)
  if (originBranchId === currentBranchId) return addDays(today, 1); 

  // Si es remoto, buscamos el tiempo en la matriz
  const transferDays = getEstimatedTransferTime(originBranchId, currentBranchId, rules);
  
  // Retornamos Hoy + Días de traslado + 1 día de margen para preparación
  return addDays(today, transferDays + 1);
};

// src/utils/reservation-logic.ts

export function checkReservationValidity(reservation: Reservation, payments: Payment[]) {
  const now = new Date();
  const diffInHours = (now.getTime() - reservation.createdAt.getTime()) / (1000 * 60 * 60);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  // REGLA 1: Si no hay un centimo de adelanto y pasaron 12 horas -> EXPIRAR
  if (totalPaid === 0 && diffInHours >= 12) {
    return "expirada";
  }

  // REGLA 2: Si hay adelanto, la reserva es válida hasta la fecha de entrega pactada
  if (totalPaid > 0 && now > reservation.startDate) {
    return "vencida_por_fecha"; // Pero no se anula automático porque hay dinero de por medio
  }

  return "valida";
}