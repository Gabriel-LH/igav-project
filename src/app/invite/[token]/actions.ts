"use server";

import prisma from "@/src/lib/prisma";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { randomUUID } from "crypto";

export async function acceptInvitationAction(token: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Debes iniciar sesión para aceptar la invitación.");
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { tenant: true, role: true, branch: true },
  });

  if (!invitation) throw new Error("Invitación no encontrada.");
  if (invitation.status !== "pending")
    throw new Error("Esta invitación ya no está activa.");
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "expired" },
    });
    throw new Error("La invitación ha expirado.");
  }

  const userId = session.user.id;

  // Check if already a member
  const existing = await prisma.userTenantMembership.findFirst({
    where: { userId, tenantId: invitation.tenantId },
  });
  if (existing) throw new Error("Ya eres miembro de este tenant.");

  const now = new Date();

  await prisma.$transaction([
    prisma.userTenantMembership.create({
      data: {
        id: randomUUID(),
        userId,
        tenantId: invitation.tenantId,
        roleId: invitation.roleId,
        defaultBranchId: invitation.branchId,
        status: "active",
        invitedBy: invitation.invitedById,
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
        acceptedAt: now,
        acceptedByUserId: userId,
      },
    }),
  ]);

  return { tenantId: invitation.tenantId };
}
