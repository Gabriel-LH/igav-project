import { PaymentMethod } from "../components/home/ui/direct-transaction/CashPaymentSummary";
import { USER_MOCK } from "../mocks/mock.user";
import { useClientCreditStore } from "../store/useClientCreditStore";
import { useOperationStore } from "../store/useOperationStore";
import { usePaymentStore } from "../store/usePaymentStore";
import { paymentSchema } from "../types/payments/type.payments";
import { getOperationBalances } from "../utils/payment-helpers";

// src/services/paymentService.ts
export function registerPayment({
  operationId,
  amount,
  method,
  receivedAmount,
}: {
  operationId: string;
  amount: number;
  method: PaymentMethod;
  receivedAmount?: number;
}) {
  const now = new Date();

  const user = USER_MOCK[0];
  const operation = useOperationStore
    .getState()
    .operations.find((op) => op.id === operationId);

  if (!operation) throw new Error("Operación no encontrada");

  const payment = paymentSchema.parse({
    id: `PAY-${crypto.randomUUID().slice(0, 8)}`,
    operationId,
    branchId: operation.branchId,
    receivedById: user.id,
    amount,
    receivedAmount,
    changeAmount: receivedAmount ? receivedAmount - amount : 0,
    method,
    type: "cuota",
    date: now,
  });

  // 1. Guardar pago
  usePaymentStore.getState().addPayment(payment);

  // 2. Recalcular saldos
  const payments = usePaymentStore
    .getState()
    .payments.filter((p) => p.operationId === operationId);

  const { balance, isCredit, creditAmount } = getOperationBalances(
    operationId,
    payments,
    operation.totalAmount,
  );

  // 3. Actualizar operación
  useOperationStore.getState().updateOperation(operationId, {
    paymentStatus: balance === 0 ? "pagado" : "parcial",
  });

  // 4. Si hay crédito → ClientCredit
  if (isCredit) {
    useClientCreditStore.getState().addEntry({
      id: `CCL-${crypto.randomUUID().slice(0, 8)}`,
      clientId: operation.customerId,
      amount: creditAmount,
      reason: "overpayment",
      operationId,
      createdAt: now,
    });
  }

  return payment;
}
