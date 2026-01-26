import { differenceInDays } from "date-fns";

interface UsePriceCalculationParams {
  operationType: "venta" | "alquiler";
  priceSell?: number;
  priceRent?: number;
  quantity: number;
  startDate?: Date;
  endDate?: Date;
  rentUnit?: "evento" | "dia";
  receivedAmount: number;     // adelanto o pago
  guaranteeAmount?: number;   // garantía en dinero
}

export function usePriceCalculation({
  operationType,
  priceSell = 0,
  priceRent = 0,
  quantity,
  startDate,
  endDate,
  rentUnit = "dia",
  receivedAmount,
  guaranteeAmount = 0,
}: UsePriceCalculationParams) {
  const isVenta = operationType === "venta";
  const isEvent = rentUnit === "evento";

  const days =
    startDate && endDate
      ? Math.max(differenceInDays(endDate, startDate) + 1, 1)
      : 1;

  // TOTAL DE LA OPERACIÓN
  const totalOperacion = isVenta
    ? priceSell * quantity
    : isEvent
      ? priceRent * quantity
      : priceRent * quantity * days;

  // 💰 INGRESO DE HOY (caja)
  const totalHoy = isVenta
    ? receivedAmount
    : receivedAmount + guaranteeAmount;

  // ⏳ SALDO PENDIENTE (solo contra el adelanto)
  const pending = Math.max(totalOperacion - receivedAmount, 0);

  return {
    days,
    totalOperacion,
    totalHoy,
    pending,
    isVenta,
    isEvent,
  };
}
