"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

const INVITATION_EXPIRY_DAYS = 7;

// -------------------------------------------------------------------
// CREATE INVITATION
// -------------------------------------------------------------------
export async function createInvitationAction(input: {
  email: string;
  roleId: string;
  branchId: string;
}) {
  const membership = await requireTenantMembership();
  const tenantId = membership.tenantId;

  const email = input.email.trim().toLowerCase();

  // Avoid duplicate pending invitations
  const existing = await prisma.invitation.findFirst({
    where: { tenantId, email, status: "pending" },
  });
  if (existing) {
    throw new Error("Ya existe una invitación pendiente para ese correo.");
  }

  // Check if user is already in this tenant
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (user) {
    const alreadyMember = await prisma.userTenantMembership.findFirst({
      where: { userId: user.id, tenantId },
    });
    if (alreadyMember) {
      throw new Error("Este usuario ya es miembro del tenant.");
    }
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  const token = randomUUID();

  const invitation = await prisma.invitation.create({
    data: {
      tenantId,
      email,
      roleId: input.roleId,
      branchId: input.branchId,
      invitedById: membership.userId,
      token,
      expiresAt,
    },
  });

  revalidatePath("/tenant/team");

  // Return the invitation link so it can be copied in dev (no email yet)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    invitationId: invitation.id,
    inviteLink: `${baseUrl}/invite/${token}`,
  };
}

// -------------------------------------------------------------------
// GET INVITATIONS for the current tenant
// -------------------------------------------------------------------
export async function getTenantInvitationsAction() {
  const membership = await requireTenantMembership();
  const tenantId = membership.tenantId;

  return prisma.invitation.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      role: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

// -------------------------------------------------------------------
// REVOKE INVITATION
// -------------------------------------------------------------------
export async function revokeInvitationAction(invitationId: string) {
  const membership = await requireTenantMembership();
  const tenantId = membership.tenantId;

  await prisma.invitation.updateMany({
    where: { id: invitationId, tenantId, status: "pending" },
    data: { status: "revoked" },
  });

  revalidatePath("/tenant/team");
}

// -------------------------------------------------------------------
// GET TEAM MEMBERS for the current tenant
// -------------------------------------------------------------------
export async function getTenantMembersAction() {
  const membership = await requireTenantMembership();
  const tenantId = membership.tenantId;

  return prisma.userTenantMembership.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
        },
      },
      role: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
