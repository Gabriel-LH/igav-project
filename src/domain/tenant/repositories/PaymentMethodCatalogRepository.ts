import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";

export interface PaymentMethodCatalogRepository {
  ensureDefaults(tenantId: string | null): Promise<PaymentMethod[]>;
  getAll(tenantId: string | null): Promise<PaymentMethod[]>;
  getById(id: string): Promise<PaymentMethod | null>;
  getByIds(ids: string[]): Promise<PaymentMethod[]>;
  create(tenantId: string | null, data: Omit<PaymentMethod, "id">): Promise<PaymentMethod>;
  update(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod>;
  delete(id: string): Promise<void>;
}
