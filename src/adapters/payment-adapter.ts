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
  amount: number;
  direction: "in" | "out";
  category: "payment" | "refund" | "correction";
  status: "pending" | "posted";
  date: Date;
  method: MethodPaymentType;
  reference: string | undefined;
  notes: string | undefined;
}

export const mapPaymentsToTable = (
  visiblePayments: Payment[],
  clients: Client[],
  operations: Operation[],
  users: User[],
): PaymentTableRow[] => {
  const sortedVisiblePayments = [...visiblePayments].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  const operationMap = new Map(operations.map((operation) => [operation.id, operation]));
  const clientMap = new Map(clients.map((client) => [client.id, client]));
  const userMap = new Map(users.map((user) => [user.id, user]));

  return sortedVisiblePayments
    .map((payment) => {
      const operation = operationMap.get(payment.operationId);
      if (!operation) return null;

      const client = clientMap.get(operation.customerId);
      const receivedBy = userMap.get(payment.receivedById);

      return {
        id: payment.id,
        clientName: `${client?.firstName ?? ""} ${client?.lastName ?? ""}`.trim(),
        operationType: operation.type,
        receivedBy: receivedBy
          ? `${receivedBy.firstName} ${receivedBy.lastName}`
          : "",
        amount: payment.amount,
        direction: payment.direction,
        category: payment.category,
        status: payment.status,
        date: payment.date,
        method: payment.method,
        reference: payment.reference,
        notes: payment.notes,
      } satisfies PaymentTableRow;
    })
    .filter((row): row is PaymentTableRow => row !== null);
};
