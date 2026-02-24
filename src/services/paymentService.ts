import { USER_MOCK } from "../mocks/mock.user";
import { useOperationStore } from "../store/useOperationStore";
import { usePaymentStore } from "../store/usePaymentStore";
import { useSaleStore } from "../store/useSaleStore";
import { paymentSchema } from "../types/payments/type.payments";
import {
  calculateOperationPaymentStatus,
  getOperationBalances,
  getNetPostedAmount,
} from "../utils/payment-helpers";
import { PaymentMethodType } from "../utils/status-type/PaymentMethodType";
import { addClientCredit } from "./use-cases/addClientCredit.usecase";
import { manageLoyaltyPoints } from "./use-cases/manageLoyaltyPoints";

export function registerPayment({
  operationId,
  amount,
  method,
  receivedAmount: _receivedAmount,
}: {
  operationId: string;
  amount: number;
  method: PaymentMethodType;
  receivedAmount?: number;
}) {
  const now = new Date();
  const user = USER_MOCK[0];
  const operation = useOperationStore
    .getState()
    .operations.find((op) => op.id === operationId);

  if (!operation) throw new Error("Operacion no encontrada");

  const payment = paymentSchema.parse({
    id: `PAY-${crypto.randomUUID().slice(0, 8)}`,
    operationId,
    branchId: operation.branchId,
    receivedById: user.id,
    amount,
    direction: "in",
    method,
    status: "posted",
    category: "payment",
    date: now,
  });

  usePaymentStore.getState().addPayment(payment);

  const operationPayments = usePaymentStore
    .getState()
    .payments.filter((payment) => payment.operationId === operationId);

  const netPaid = getNetPostedAmount(operationPayments);
  const paymentStatus = calculateOperationPaymentStatus(
    operation.totalAmount,
    netPaid,
  );

  const { balance, isCredit, creditAmount } = getOperationBalances(
    operationId,
    operationPayments,
    operation.totalAmount,
  );

  useOperationStore.getState().updateOperation(operationId, {
    paymentStatus,
  });

  if (isCredit && creditAmount > 0) {
    addClientCredit(
      operation.customerId,
      creditAmount,
      "overpayment",
      operationId,
    );
  }

  if (amount > 0) {
    const pointsEarned = Math.floor(amount / 10);
    if (pointsEarned > 0) {
      manageLoyaltyPoints({
        clientId: operation.customerId,
        points: pointsEarned,
        type: "earned_purchase",
        operationId,
        description: "Puntos por pago de cuota",
      });
    }
  }

  if (operation.type === "venta" && balance === 0) {
    const saleStore = useSaleStore.getState();
    const sale = saleStore.sales.find((currentSale) => currentSale.operationId === operationId);

    if (sale && sale.status === "pendiente_pago") {
      saleStore.updateSale(sale.id, {
        status: "vendido_pendiente_entrega",
        updatedAt: now,
        updatedBy: user.id,
      });
    }
  }

  return payment;
}
