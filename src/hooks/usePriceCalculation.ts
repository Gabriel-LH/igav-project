import { differenceInDays } from "date-fns";

interface UsePriceCalculationParams {
  operationType: "venta" | "alquiler";
  priceSell?: number;
  priceRent?: number;
  quantity: number;
  startDate?: Date;
  endDate?: Date;
  rentUnit?: "evento" | "día";
  receivedAmount: number; // adelanto o pago
  guaranteeAmount?: number; // garantía en dinero
  availableCredit?: number; // 👈 NUEVO: Crédito del cliente
  useCredit?: boolean;
}

export function usePriceCalculation({
  operationType,
  priceSell = 0,
  priceRent = 0,
  quantity,
  startDate,
  endDate,
  rentUnit = "día",
  receivedAmount,
  guaranteeAmount = 0,
  availableCredit = 0,
  useCredit = false,
}: UsePriceCalculationParams) {
  const isVenta = operationType === "venta";
  const isEvent = rentUnit === "evento";

  const days =
    startDate && endDate
      ? Math.max(differenceInDays(endDate, startDate) + 1, 1)
      : 1;

  // SUBTOTAL DE LA OPERACIÓN
  const subtotal = isVenta
    ? priceSell * quantity
    : isEvent
      ? priceRent * quantity
      : priceRent * quantity * days;

  const creditApplied = useCredit ? Math.min(availableCredit, subtotal) : 0;
  const totalOperacion = subtotal - creditApplied;

  // 💰 INGRESO DE HOY (Lo que entra a caja físicamente)
  const totalHoy = receivedAmount + (isVenta ? 0 : guaranteeAmount);

  // ⏳ SALDO PENDIENTE
  const pending = Math.max(totalOperacion - receivedAmount, 0);

  return {
    days,
    subtotal, // Precio original
    creditApplied, // Cuánto se descontó por crédito
    totalOperacion, // Lo que queda por pagar tras el crédito
    totalHoy,
    pending,
    isVenta,
    isEvent,
  };
}
