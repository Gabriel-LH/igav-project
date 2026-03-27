import { Client } from "../types/clients/type.client";
import { Operation } from "../types/operation/type.operations";
import { PaymentMethod } from "../types/payments/type.paymentMethod";
import { Payment } from "../types/payments/type.payments";
import { User } from "../types/user/type.user";
import { MethodPaymentType } from "../utils/status-type/MethodPaymentType";
import { OperationType } from "../utils/status-type/OperationType";

export interface PaymentTableRow {
  id: string;
  clientName: string;
  operationType: string;
  receivedBy: string;
  amount: number;
  direction: "in" | "out";
  category: "payment" | "refund" | "correction";
  status: "pending" | "posted";
  date: Date;
  method: MethodPaymentType;
  reference: OperationType;
  notes: string | undefined;
}

export const mapPaymentsToTable = (
  visiblePayments: Payment[],
  clients: Client[],
  operations: Operation[],
  users: User[],
  paymentMethods: PaymentMethod[],
): PaymentTableRow[] => {
  const sortedVisiblePayments = [...visiblePayments].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  const operationMap = new Map(
    operations.map((operation) => [operation.id, operation]),
  );
  const clientMap = new Map(clients.map((client) => [client.id, client]));
  const userMap = new Map(users.map((user) => [user.id, user]));
  const paymentMethodMap = new Map(
    paymentMethods.map((method) => [method.id, method]),
  );

  return sortedVisiblePayments.map((payment) => {
      const operation = operationMap.get(payment.operationId);
      const client = operation ? clientMap.get(operation.customerId) : undefined;
      const receivedBy = userMap.get(payment.receivedById);
      const fallbackReference = payment.reference || payment.operationId;

      return {
        id: payment.id,
        clientName:
          `${client?.firstName ?? ""} ${client?.lastName ?? ""}`.trim() ||
          "Cliente general",
        operationType: operation?.referenceCode || fallbackReference || "Sin referencia",
        receivedBy: receivedBy
          ? `${receivedBy.firstName} ${receivedBy.lastName}`
          : payment.receivedById,
        amount: payment.amount,
        direction: payment.direction,
        category: payment.category,
        status: payment.status,
        date: payment.date,
        method:
          (paymentMethodMap.get(payment.paymentMethodId)?.name ||
            payment.paymentMethodId) as MethodPaymentType,
        reference: (operation?.type || "venta") as OperationType,
        notes: payment.notes,
      } satisfies PaymentTableRow;
    });
};
