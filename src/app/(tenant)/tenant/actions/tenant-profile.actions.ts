"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { revalidatePath } from "next/cache";

export async function getTenantProfileAction() {
  const membership = await requireTenantMembership();
  const tenantId = membership.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, metadata: true },
  });

  if (!tenant) return null;

  const metadata = (tenant.metadata as any) || {};

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: typeof metadata.logoUrl === "string" ? metadata.logoUrl : "",
  };
}

export async function updateTenantProfileAction(input: {
  name: string;
  logoUrl?: string;
}) {
  const membership = await requireTenantMembership();
  const tenantId = membership.tenantId;

  const name = (input.name || "").trim();
  const logoUrl = (input.logoUrl || "").trim();

  if (!name) {
    throw new Error("El nombre del negocio es requerido.");
  }

  const current = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { metadata: true },
  });

  const metadata = { ...(current?.metadata as any) };
  if (logoUrl) {
    metadata.logoUrl = logoUrl;
  } else {
    delete metadata.logoUrl;
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name,
      metadata,
    },
  });

  revalidatePath("/tenant/settings");
  revalidatePath("/tenant/home");

  return { ok: true };
}
