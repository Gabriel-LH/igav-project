import { PaymentRepository } from "../../../domain/tenant/repositories/PaymentRepository";
import { Payment } from "../../../types/payments/type.payments";
import { usePaymentStore } from "../../../store/usePaymentStore";

export class ZustandPaymentRepository implements PaymentRepository {
  addPayment(payment: Payment): void {
    usePaymentStore.getState().addPayment(payment);
  }

  getPaymentsByOperationId(operationId: string): Payment[] {
    return usePaymentStore
      .getState()
      .payments.filter((p) => p.operationId === operationId);
  }
}
