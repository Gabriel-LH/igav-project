import { PaymentMethodCatalogRepository } from "@/src/domain/tenant/repositories/PaymentMethodCatalogRepository";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";

type PaymentMethodConfigEntry = Partial<PaymentMethod> & {
  id?: string;
  name?: string;
  type?: string;
  active?: boolean;
};

const normalizeText = (value: string | undefined) =>
  (value ?? "").trim().toLowerCase();

export class GetAvailablePaymentMethodsUseCase {
  constructor(
    private readonly paymentMethodRepo: PaymentMethodCatalogRepository,
  ) {}

  async execute(tenantConfig: unknown): Promise<PaymentMethod[]> {
    const catalogMethods = await this.paymentMethodRepo.ensureDefaults();
    const configuredEntries = this.extractConfigEntries(tenantConfig);

    if (configuredEntries.length === 0) {
      return catalogMethods.filter((method) => method.active);
    }

    const enabledMethodIds = new Set(
      configuredEntries
        .filter((entry) => entry.active !== false)
        .map((entry) => this.resolveCatalogMethod(entry, catalogMethods)?.id)
        .filter((id): id is string => Boolean(id)),
    );

    if (enabledMethodIds.size === 0) {
      return catalogMethods.filter((method) => method.active);
    }

    return catalogMethods.filter(
      (method) => method.active && enabledMethodIds.has(method.id),
    );
  }

  private extractConfigEntries(
    tenantConfig: unknown,
  ): PaymentMethodConfigEntry[] {
    if (!tenantConfig || typeof tenantConfig !== "object") {
      return [];
    }

    const cashConfig = (tenantConfig as Record<string, unknown>).cash;
    if (!cashConfig || typeof cashConfig !== "object") {
      return [];
    }

    const paymentMethods = (cashConfig as Record<string, unknown>).paymentMethods;
    if (!Array.isArray(paymentMethods)) {
      return [];
    }

    return paymentMethods.filter(
      (entry): entry is PaymentMethodConfigEntry =>
        Boolean(entry) && typeof entry === "object",
    );
  }

  private resolveCatalogMethod(
    configEntry: PaymentMethodConfigEntry,
    catalogMethods: PaymentMethod[],
  ) {
    if (configEntry.id) {
      const byId = catalogMethods.find((method) => method.id === configEntry.id);
      if (byId) {
        return byId;
      }
    }

    const normalizedName = normalizeText(configEntry.name);
    const normalizedType = normalizeText(configEntry.type);

    return catalogMethods.find(
      (method) =>
        normalizeText(method.name) === normalizedName &&
        normalizeText(method.type) === normalizedType,
    );
  }
}
