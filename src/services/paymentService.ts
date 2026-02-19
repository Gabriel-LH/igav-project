import { PaymentMethodType } from "../utils/status-type/PaymentMethodType";
import { USER_MOCK } from "../mocks/mock.user";
import { useOperationStore } from "../store/useOperationStore";
import { usePaymentStore } from "../store/usePaymentStore";
import { useSaleStore } from "../store/useSaleStore";
import { paymentSchema } from "../types/payments/type.payments";
import { getOperationBalances } from "../utils/payment-helpers";
import { addClientCredit } from "./use-cases/addClientCredit.usecase";
import { manageLoyaltyPoints } from "./use-cases/manageLoyaltyPoints";

// src/services/paymentService.ts
export function registerPayment({
  operationId,
  amount,
  method,
  receivedAmount,
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
  if (isCredit && creditAmount > 0) {
    // En lugar de llamar al store directamente, llamamos al Caso de Uso.
    // Esto asegura que se actualice el Ledger Y el walletBalance del cliente.
    addClientCredit(
      operation.customerId,
      creditAmount,
      "overpayment",
      operationId,
    );
  }

  // El cliente gana puntos por el 'amount' (lo que realmente pagó de la deuda), 
  // no por el overpayment.
  if (amount > 0) {
      const pointsEarned = Math.floor(amount / 10); // Ej: 1 pt por cada S/ 10
      if (pointsEarned > 0) {
          manageLoyaltyPoints({
              clientId: operation.customerId,
              points: pointsEarned,
              type: "earned_purchase",
              operationId: operationId,
              description: `Puntos por pago de cuota`
          });
      }
  }

  if (operation.type === "venta" && balance === 0) {
    const saleStore = useSaleStore.getState();

    const sale = saleStore.sales.find((s) => s.operationId === operationId);

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
