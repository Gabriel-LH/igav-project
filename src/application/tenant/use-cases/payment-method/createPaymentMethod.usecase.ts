import { PaymentMethodCatalogRepository } from "@/src/domain/tenant/repositories/PaymentMethodCatalogRepository";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";

export class CreatePaymentMethodUseCase {
  constructor(
    private readonly paymentMethodRepo: PaymentMethodCatalogRepository,
  ) {}

  async execute(tenantId: string | null, data: Omit<PaymentMethod, "id">): Promise<PaymentMethod> {
    return this.paymentMethodRepo.create(tenantId, data);
  }
}
