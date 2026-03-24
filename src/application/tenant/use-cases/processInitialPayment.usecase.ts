import { PaymentRepository } from "../../../domain/tenant/repositories/PaymentRepository";
import { paymentSchema } from "../../../types/payments/type.payments";

export class ProcessInitialPaymentUseCase {
  constructor(private paymentRepo: PaymentRepository) {}

  async execute(params: {
    downPayment: number;
    paymentMethod: string;
    operationId: string;
    branchId: string;
    sellerId: string;
    tenantId: string;
  }): Promise<void> {
    if (params.downPayment <= 0) return;
    if (!params.tenantId) {
      throw new Error("tenantId es obligatorio para registrar pagos");
    }

    const now = new Date();
    const paymentData = paymentSchema.parse({
      id: `PAY-${Math.random().toString(36).toUpperCase().substring(2, 9)}`,
      operationId: params.operationId,
      branchId: params.branchId,
      receivedById: params.sellerId,
      amount: params.downPayment,
      direction: "in",
      paymentMethodId: params.paymentMethod,
      status: "posted",
      category: "payment",
      date: now,
      createdAt: now,
      tenantId: params.tenantId,
    });

    await this.paymentRepo.addPayment(paymentData);
  }
}
