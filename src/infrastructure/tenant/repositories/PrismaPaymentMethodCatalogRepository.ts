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

  async ensureDefaults(): Promise<PaymentMethod[]> {
    const currentMethods = await this.prisma.paymentMethod.findMany();

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

  async getAll(): Promise<PaymentMethod[]> {
    const methods = await this.prisma.paymentMethod.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });

    return methods.map(mapPrismaPaymentMethod);
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
