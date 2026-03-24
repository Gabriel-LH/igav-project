import prisma from "@/src/lib/prisma";
import { PrismaPaymentMethodCatalogRepository } from "@/src/infrastructure/tenant/repositories/PrismaPaymentMethodCatalogRepository";

const normalize = (value: string) => value.trim().toLowerCase();

export async function resolvePaymentMethodId(
  rawMethod: unknown,
): Promise<string | null> {
  if (typeof rawMethod !== "string") return null;
  const trimmed = rawMethod.trim();
  if (!trimmed) return null;

  const repo = new PrismaPaymentMethodCatalogRepository(prisma);
  const methods = await repo.ensureDefaults();

  const byId = methods.find((method) => method.id === trimmed);
  if (byId) return byId.id;

  const normalized = normalize(trimmed);

  const byType = methods.find(
    (method) => normalize(method.type) === normalized,
  );
  if (byType) return byType.id;

  const byName = methods.find(
    (method) =>
      normalize(method.name) === normalized ||
      normalize(method.icon ?? "") === normalized,
  );

  return byName?.id ?? null;
}
