import { auth } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { headers } from "next/headers";

export async function requireTenantMembership() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized: Login required");
  }

  if (session.user.globalRole === "SUPER_ADMIN") {
    return {
      user: session.user,
      membership: null,
      tenantId: null,
    };
  }

  const membership = await prisma.userTenantMembership.findFirst({
    where: {
      userId: session.user.id,
      status: "active",
    },
    select: {
      id: true,
      userId: true,
      tenantId: true,
      roleId: true,
      defaultBranchId: true,
      status: true,
      invitedBy: true,
      createdAt: true,
      updatedAt: true,
      pinHash: true,
      pinSetAt: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          metadata: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!membership) {
    return {
      user: session.user,
      membership: null,
      tenantId: null,
    };
  }

  return {
    user: session.user,
    membership,
    tenantId: membership.tenantId,
  };
}
