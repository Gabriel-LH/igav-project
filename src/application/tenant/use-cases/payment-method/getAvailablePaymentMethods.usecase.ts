import { PaymentMethodCatalogRepository } from "@/src/domain/tenant/repositories/PaymentMethodCatalogRepository";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";

export interface GetPaymentMethodsOptions {
  onlyActive?: boolean;
}

export class GetAvailablePaymentMethodsUseCase {
  constructor(
    private readonly paymentMethodRepo: PaymentMethodCatalogRepository,
  ) {}

  /**
   * Obtiene los métodos de pago disponibles para un inquilino.
   * La base de datos es ahora la única fuente de verdad.
   */
  async execute(
    tenantId: string | null,
    options: GetPaymentMethodsOptions = { onlyActive: true }
  ): Promise<PaymentMethod[]> {
    // Si tenantId es null, obtenemos los globales.
    // Solo retornamos vacío si algo sale mal con los defaults.

    // Aseguramos los métodos por defecto y obtenemos todos los actuales
    const methods = await this.paymentMethodRepo.ensureDefaults(tenantId);

    if (options.onlyActive) {
      return methods.filter((method) => method.active);
    }

    return methods;
  }
}
