import { PaymentMethodCatalogRepository } from "@/src/domain/tenant/repositories/PaymentMethodCatalogRepository";

export class DeletePaymentMethodUseCase {
  constructor(
    private readonly paymentMethodRepo: PaymentMethodCatalogRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.paymentMethodRepo.getById(id);
    if (!existing) {
      throw new Error("Método de pago no encontrado");
    }
    await this.paymentMethodRepo.delete(id);
  }
}
