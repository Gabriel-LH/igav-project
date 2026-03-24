import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";

export interface PaymentMethodCatalogRepository {
  ensureDefaults(): Promise<PaymentMethod[]>;
  getAll(): Promise<PaymentMethod[]>;
  getByIds(ids: string[]): Promise<PaymentMethod[]>;
}
