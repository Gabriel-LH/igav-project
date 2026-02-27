import { Payment } from "../../types/payments/type.payments";

export interface PaymentRepository {
  addPayment(payment: Payment): void;
  getPaymentsByOperationId(operationId: string): Payment[];
}
