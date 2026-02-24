import { MOCK_RESERVATION_ITEM } from "../mocks/mock.reservationItem";
import { Operation } from "../types/operation/type.operations";
import { Payment } from "../types/payments/type.payments";

export const calculatePaymentStatus = (
  totalAmount: number,
  totalPaid: number,
): "no_pagado" | "parcial" | "pagado" => {
  if (totalPaid <= 0) return "no_pagado";
  if (totalPaid >= totalAmount) return "pagado";
  return "parcial";
};

export const calculateOperationPaymentStatus = (
  totalAmount: number,
  netPaid: number,
): "pendiente" | "parcial" | "pagado" => {
  if (netPaid <= 0) return "pendiente";
  if (netPaid >= totalAmount) return "pagado";
  return "parcial";
};

export const getNetPostedAmount = (payments: Payment[]): number => {
  return payments
    .filter((payment) => payment.status === "posted")
    .reduce((acc, payment) => {
      const signedAmount = payment.direction === "in" ? payment.amount : -payment.amount;
      return acc + signedAmount;
    }, 0);
};

export const sumPayments = (payments: { amount: number }[]): number => {
  return payments.reduce((acc, curr) => acc + curr.amount, 0);
};

export const getRemainingBalance = (
  totalAmount: number,
  totalPaid: number,
): number => {
  const balance = totalAmount - totalPaid;
  return balance > 0 ? balance : 0;
};

export const calculateOperationTotal = (reservationId: string) => {
  const items = MOCK_RESERVATION_ITEM.filter(
    (item) => item.reservationId === reservationId,
  );

  return items.reduce(
    (total, item) => total + item.priceAtMoment * item.quantity,
    0,
  );
};

export const getUpdatedPaymentStatus = (
  operation: Operation,
  payments: Payment[],
) => {
  const operationPayments = payments.filter(
    (payment) => payment.operationId === operation.id,
  );
  const totalPaid = getNetPostedAmount(operationPayments);
  const remaining = operation.totalAmount - totalPaid;

  return {
    status: calculatePaymentStatus(operation.totalAmount, totalPaid),
    totalPaid,
    remaining: remaining > 0 ? remaining : 0,
  };
};

export const getOperationBalances = (
  operationId: string,
  payments: Payment[],
  totalToPay: number,
) => {
  const operationPayments = payments.filter(
    (payment) => String(payment.operationId) === String(operationId),
  );
  const postedPayments = operationPayments.filter(
    (payment) => payment.status === "posted",
  );

  const totalIn = postedPayments
    .filter((payment) => payment.direction === "in")
    .reduce((acc, payment) => acc + payment.amount, 0);

  const totalOut = postedPayments
    .filter((payment) => payment.direction === "out")
    .reduce((acc, payment) => acc + payment.amount, 0);

  const totalPaid = totalIn - totalOut;
  const diff = totalPaid - totalToPay;

  return {
    totalCalculated: totalToPay,
    totalPaid,
    totalIn,
    totalOut,
    balance: diff < 0 ? Math.abs(diff) : 0,
    creditAmount: diff > 0 ? diff : 0,
    isCredit: diff > 0,
    isPaid: diff >= 0,
  };
};

export const validateNewPayment = (
  operation: Operation,
  currentPayments: Payment[],
  newAmount: number,
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
    newRemaining: remaining - newAmount,
  };
};
