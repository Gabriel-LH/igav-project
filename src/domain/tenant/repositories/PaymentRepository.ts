import { Payment } from "../../../types/payments/type.payments";

export interface PaymentRepository {
  addPayment(payment: Payment): Promise<void>;
  getPaymentsByOperationId(operationId: string): Promise<Payment[]>;
  getPaymentsByTenant(tenantId: string): Promise<Payment[]>;
}
