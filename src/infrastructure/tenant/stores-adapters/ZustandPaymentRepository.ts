import { PaymentRepository } from "../../../domain/tenant/repositories/PaymentRepository";
import { Payment } from "../../../types/payments/type.payments";
import { usePaymentStore } from "../../../store/usePaymentStore";

export class ZustandPaymentRepository implements PaymentRepository {
  async addPayment(payment: Payment): Promise<void> {
    usePaymentStore.getState().addPayment(payment);
  }

  async getPaymentsByOperationId(operationId: string): Promise<Payment[]> {
    return usePaymentStore
      .getState()
      .payments.filter((p) => p.operationId === operationId);
  }

  async getPaymentsByTenant(tenantId: string): Promise<Payment[]> {
    return usePaymentStore
      .getState()
      .payments.filter((p) => p.tenantId === tenantId);
  }
}
