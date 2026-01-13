// src/utils/payment-helpers.ts

import { Payment } from "../types/payments/type.payments";
import { Operation } from "../types/operation/type.operations";
import { MOCK_RESERVATION_ITEM } from "../mocks/mock.reservationItem";

/**
 * Calcula el estado de pago basado en el total y lo abonado.
 */
export const calculatePaymentStatus = (
  totalAmount: number, 
  totalPaid: number
): "no_pagado" | "parcial" | "pagado" => {
  if (totalPaid <= 0) return "no_pagado";
  if (totalPaid >= totalAmount) return "pagado";
  return "parcial";
};

/**
 * Suma todos los abonos de un historial de pagos.
 */
export const sumPayments = (payments: { amount: number }[]): number => {
  return payments.reduce((acc, curr) => acc + curr.amount, 0);
};

/**
 * Calcula el saldo restante de una operación.
 */
export const getRemainingBalance = (totalAmount: number, totalPaid: number): number => {
  const balance = totalAmount - totalPaid;
  return balance > 0 ? balance : 0;
};

// Lógica conceptual para calcular el total de una operación
export const calculateOperationTotal = (reservationId: string) => {
  // 1. Buscamos todos los ítems de esa reserva
  const items = MOCK_RESERVATION_ITEM.filter(item => item.reservationId === reservationId);

  // 2. Sumamos los precios que se pactaron al momento de reservar
  // (Usamos priceAtMoment porque el precio del producto podría cambiar mañana en el catálogo)
  return items.reduce((total, item) => total + (item.priceAtMoment * item.quantity), 0);
};
/**
 * Recibe una operación y sus pagos, y devuelve el estado de pago correcto.
 */
export const getUpdatedPaymentStatus = (operation: Operation, payments: Payment[]) => {
  const totalPaid = payments
    .filter(p => p.operationId === operation.id)
    .reduce((sum, p) => sum + p.amount, 0);

  const remaining = operation.totalAmount - totalPaid;

  let status: "no_pagado" | "parcial" | "pagado" = "no_pagado";
  
  if (totalPaid > 0 && totalPaid < operation.totalAmount) {
    status = "parcial";
  } else if (totalPaid >= operation.totalAmount) {
    status = "pagado";
  }

  return {
    status,
    totalPaid,
    remaining: remaining > 0 ? remaining : 0
  };
};

export const getOperationBalances = (reservationId: string, payments: Payment[]) => {
  // 1. Calculamos el total real sumando los items actuales en los mocks
  const currentItems = MOCK_RESERVATION_ITEM.filter(
    (item) => item.reservationId === reservationId
  );

  const totalCalculated = currentItems.reduce(
    (acc, item) => acc + (item.priceAtMoment * item.quantity),
    0
  );

  // 2. Filtramos y sumamos solo los pagos que NO son garantía
  const paymentsOnly = payments.filter((p) => p.type !== "garantia");
  const totalPaid = paymentsOnly.reduce((acc, p) => acc + p.amount, 0);

  // 3. El saldo final
  const balance = totalCalculated - totalPaid;

  return {
    totalCalculated, // Lo que cuestan los productos hoy
    totalPaid,       // Lo que ya pagó el cliente
    balance,         // Lo que falta cobrar (si es negativo, es saldo a favor)
    itemsCount: currentItems.length
  };
};

/**
 * Valida si un nuevo pago es posible y retorna la información actualizada.
 * Útil para formularios de "Añadir Abono".
 */
export const validateNewPayment = (
  operation: Operation,
  currentPayments: Payment[],
  newAmount: number
) => {
  const { remaining } = getUpdatedPaymentStatus(operation, currentPayments);

  if (newAmount <= 0) {
    throw new Error("El monto del pago debe ser mayor a cero.");
  }

  if (newAmount > remaining) {
    throw new Error(`El pago excede el saldo pendiente ($${remaining}).`);
  }

  return {
    isCompletingPayment: newAmount === remaining,
    newRemaining: remaining - newAmount
  };
};