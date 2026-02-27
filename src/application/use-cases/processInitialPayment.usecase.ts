import { PaymentRepository } from "../../domain/repositories/PaymentRepository";
import { paymentSchema } from "../../types/payments/type.payments";

export class ProcessInitialPaymentUseCase {
  constructor(private paymentRepo: PaymentRepository) {}

  execute(params: {
    downPayment: number;
    paymentMethod: string;
    operationId: string;
    branchId: string;
    sellerId: string;
  }): void {
    if (params.downPayment <= 0) return;

    const now = new Date();
    const paymentData = paymentSchema.parse({
      id: `PAY-${Math.random().toString(36).toUpperCase().substring(2, 9)}`,
      operationId: params.operationId,
      branchId: params.branchId,
      receivedById: params.sellerId,
      amount: params.downPayment,
      direction: "in",
      method: params.paymentMethod,
      status: "posted",
      category: "payment",
      date: now,
    });

    this.paymentRepo.addPayment(paymentData);
  }
}
