import { Client } from "../types/clients/type.client";
import { Operation } from "../types/operation/type.operations";
import { Payment } from "../types/payments/type.payments";
import { User } from "../types/user/type.user";
import { MethodPaymentType } from "../utils/status-type/MethodPaymentType";
import { OperationType } from "../utils/status-type/OperationType";

export interface PaymentTableRow {
  id: string;
  clientName: string;
  operationType: OperationType;
  receivedBy: string;
  totalAmount: number;
  amount: number;
  direction: "in" | "out";
  category: "payment" | "refund" | "correction";
  status: "pending" | "posted";
  netPaid: number;
  remaining: number;
  date: Date;
  method: MethodPaymentType;
  reference: string;
  notes: string | undefined;

  currentRemaining: number; // La deuda REAL a día de hoy
  hasSubsequentCorrections: boolean; // Para pintar el badge rojo
}

export const mapPaymentsToTable = (
  visiblePayments: Payment[],
  allPayments: Payment[],
  clients: Client[],
  operations: Operation[],
  users: User[],
): PaymentTableRow[] => {
  const sortedVisiblePayments = [...visiblePayments].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const operationMap = new Map(operations.map((op) => [op.id, op]));
  const clientMap = new Map(clients.map((client) => [client.id, client]));
  const userMap = new Map(users.map((user) => [user.id, user]));

  const paymentsByOperation = new Map<string, Payment[]>();
  for (const payment of allPayments) {
    const list = paymentsByOperation.get(payment.operationId) ?? [];
    list.push(payment);
    paymentsByOperation.set(payment.operationId, list);
  }

  // Índice precomputado: netPaid acumulado exactamente en cada payment.id
  const netPaidByPaymentId = new Map<string, number>();
  for (const opPayments of paymentsByOperation.values()) {
    const sortedByDate = [...opPayments].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    let runningBalance = 0;
    for (const payment of sortedByDate) {
      if (payment.status === "posted") {
        runningBalance +=
          payment.direction === "in" ? payment.amount : -payment.amount;
      }
      netPaidByPaymentId.set(payment.id, runningBalance);
    }
  }

  return sortedVisiblePayments
    .map((payment) => {
      const operation = operationMap.get(payment.operationId);
      if (!operation) return null;

      const client = clientMap.get(operation.customerId);
      const receivedBy = userMap.get(payment.receivedById);

      console.log("ID de todos los usuarios", payment.receivedById);

      // 1. Datos Históricos (En ese milisegundo)
      const netPaid = netPaidByPaymentId.get(payment.id) ?? 0;
      const remaining = operation.totalAmount - netPaid;

      // 🌟 2. LA MAGIA PRO: Datos Actuales (Hoy)
      // Obtenemos todos los pagos de ESTA operación específica
      const opPayments = paymentsByOperation.get(operation.id) ?? [];

      // Calculamos cuánto se ha pagado en total hasta HOY
      const currentNetPaid = opPayments.reduce(
        (acc, p) =>
          p.status === "posted"
            ? p.direction === "in"
              ? acc + p.amount
              : acc - p.amount
            : acc,
        0,
      );

      const currentRemaining = operation.totalAmount - currentNetPaid;

      // ¿Esta operación tiene reembolsos o correcciones?
      const hasCorrections = opPayments.some(
        (p) => p.category === "refund" || p.category === "correction",
      );

      return {
        id: payment.id,
        clientName:
          `${client?.firstName ?? ""} ${client?.lastName ?? ""}`.trim(),
        operationType: operation.type,
        receivedBy: receivedBy
          ? `${receivedBy.firstName} ${receivedBy.lastName}`
          : "",
        totalAmount: operation.totalAmount,
        amount: payment.amount,
        direction: payment.direction,
        category: payment.category,
        status: payment.status,
        date: payment.date,
        method: payment.method,
        reference: payment.reference!,
        notes: payment.notes,

        // Asignamos los históricos
        netPaid,
        remaining,

        // 🌟 Asignamos los nuevos datos PRO
        currentRemaining,
        // Solo avisamos en el pago original, no en el reembolso en sí
        hasSubsequentCorrections:
          payment.category === "payment" && hasCorrections,
      } satisfies PaymentTableRow;
    })
    .filter((row): row is PaymentTableRow => row !== null);
};
