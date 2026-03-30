import { PaymentMethodCatalogRepository } from "@/src/domain/tenant/repositories/PaymentMethodCatalogRepository";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";

export class UpdatePaymentMethodUseCase {
  constructor(
    private readonly paymentMethodRepo: PaymentMethodCatalogRepository,
  ) {}

  async execute(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const existing = await this.paymentMethodRepo.getById(id);
    if (!existing) {
      throw new Error("Método de pago no encontrado");
    }
    return this.paymentMethodRepo.update(id, data);
  }
}
