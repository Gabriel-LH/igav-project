import { differenceInCalendarDays } from "date-fns";
import { RentalsPolicy } from "@/src/types/tenant/type.tenantPolicy";

/**
 * Calcula los días de alquiler cobrables basándose en la política del tenant.
 * 
 * Lógica:
 * 1. Calculamos los días calendario totales (Ej: Vie a Dom = 3 días).
 * 2. Si la política indica no cobrar el día de retiro, restamos 1.
 * 3. Si la política indica no cobrar el día de entrega, restamos 1.
 * 4. El mínimo siempre será 1 día (salvo que las fechas sean nulas).
 */
export function calculateChargeableDays(
  from: Date | string | undefined | null,
  to: Date | string | undefined | null,
  policy?: RentalsPolicy | null
): number {
  if (!from || !to) return 1;

  const startDate = new Date(from);
  const endDate = new Date(to);

  const calendarDiff = differenceInCalendarDays(endDate, startDate);
  
  // Caso 1: Mismo día
  if (calendarDiff === 0) return 1;

  // Caso 2: Diferencia negativa (error de entrada)
  if (calendarDiff < 0) return 1;

  // Si no hay política, usamos el comportamiento estándar de "Noches" (Diferencia)
  if (!policy) return calendarDiff;

  const chargePickup = policy.chargePickupDay ?? policy.inclusiveDayCalculation ?? true;
  const chargeReturn = policy.chargeReturnDay ?? policy.inclusiveDayCalculation ?? true;

  // Lógica Segmentada:
  // 1. Días Plenos (estrictamente entre las dos fechas)
  const fullIntermediateDays = Math.max(0, calendarDiff - 1);
  
  // 2. Sumar extremos según política
  let finalDays = fullIntermediateDays;
  if (chargePickup) finalDays += 1;
  if (chargeReturn) finalDays += 1;

  // Ajuste de seguridad: Mínimo 1 día
  return Math.max(1, finalDays);
}
