import {
  PaymentMethod as PrismaPaymentMethodRecord,
  PaymentMethodType,
  Prisma,
  PrismaClient,
} from "@/prisma/generated/client";
import { PaymentMethodCatalogRepository } from "@/src/domain/tenant/repositories/PaymentMethodCatalogRepository";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";

const DEFAULT_PAYMENT_METHODS: Array<Omit<PaymentMethod, "id">> = [
  {
    name: "Efectivo",
    type: "cash",
    active: true,
    allowsChange: true,
    requiresPin: false,
    icon: "cash",
  },
  {
    name: "Tarjeta",
    type: "card",
    active: true,
    allowsChange: false,
    requiresPin: true,
    icon: "card",
  },
  {
    name: "Transferencia",
    type: "transfer",
    active: true,
    allowsChange: false,
    requiresPin: false,
    icon: "transfer",
  },
  {
    name: "Yape",
    type: "digital",
    active: true,
    allowsChange: false,
    requiresPin: false,
    icon: "yape",
  },
  {
    name: "Plin",
    type: "digital",
    active: true,
    allowsChange: false,
    requiresPin: false,
    icon: "plin",
  },
  {
    name: "Crédito",
    type: "credit",
    active: true,
    allowsChange: false,
    requiresPin: false,
    icon: "credit",
  },
];

const normalizeText = (value: string) => value.trim().toLowerCase();

const mapPrismaPaymentMethod = (
  method: PrismaPaymentMethodRecord,
): PaymentMethod => ({
  id: method.id,
  name: method.name,
  type: method.type,
  active: method.active,
  allowsChange: method.allowsChange,
  requiresPin: method.requiresPin,
  icon: method.icon ?? undefined,
});

export class PrismaPaymentMethodCatalogRepository
  implements PaymentMethodCatalogRepository
{
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}
  async ensureDefaults(tenantId: string | null): Promise<PaymentMethod[]> {
    const currentMethods = await this.prisma.paymentMethod.findMany({
      where: {
        OR: [{ tenantId: tenantId ?? undefined }, { tenantId: null }],
      },
    });

    for (const defaultMethod of DEFAULT_PAYMENT_METHODS) {
      const alreadyExists = currentMethods.some(
        (method) =>
          normalizeText(method.name) === normalizeText(defaultMethod.name) &&
          method.type === defaultMethod.type,
      );

      if (alreadyExists) {
        continue;
      }

      const created = await this.prisma.paymentMethod.create({
        data: {
          tenantId,
          name: defaultMethod.name,
          type: defaultMethod.type as PaymentMethodType,
          active: defaultMethod.active,
          allowsChange: defaultMethod.allowsChange,
          requiresPin: defaultMethod.requiresPin,
          icon: defaultMethod.icon,
        },
      });

      currentMethods.push(created);
    }

    return currentMethods.map(mapPrismaPaymentMethod);
  }

  async getAll(tenantId: string | null): Promise<PaymentMethod[]> {
    const methods = await this.prisma.paymentMethod.findMany({
      where: {
        OR: [{ tenantId: tenantId ?? undefined }, { tenantId: null }],
      },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });

    return methods.map(mapPrismaPaymentMethod);
  }

  async getById(id: string): Promise<PaymentMethod | null> {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });
    return method ? mapPrismaPaymentMethod(method) : null;
  }

  async create(tenantId: string | null, data: Omit<PaymentMethod, "id">): Promise<PaymentMethod> {
    const created = await this.prisma.paymentMethod.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type as PaymentMethodType,
        active: data.active,
        allowsChange: data.allowsChange,
        requiresPin: data.requiresPin,
        icon: data.icon,
      },
    });
    return mapPrismaPaymentMethod(created);
  }

  async update(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const updated = await this.prisma.paymentMethod.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type as PaymentMethodType,
        active: data.active,
        allowsChange: data.allowsChange,
        requiresPin: data.requiresPin,
        icon: data.icon,
      },
    });
    return mapPrismaPaymentMethod(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.paymentMethod.delete({
      where: { id },
    });
  }

  async getByIds(ids: string[]): Promise<PaymentMethod[]> {
    if (ids.length === 0) {
      return [];
    }

    const methods = await this.prisma.paymentMethod.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      orderBy: { name: "asc" },
    });

    return methods.map(mapPrismaPaymentMethod);
  }
}
