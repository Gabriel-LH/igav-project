import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import prisma from "@/src/lib/prisma";

export async function requireTenantMembership() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    console.log("[AUTH_GUARD] No session found");
    throw new Error("AUTH_SESSION_MISSING");
  }

  // Handle Super Admin
  if (session.user.globalRole === "SUPER_ADMIN") {
    console.log("[AUTH_GUARD] Super Admin detected:", session.user.email);
    return {
      id: "super-admin-id",
      userId: session.user.id,
      tenantId: null as any,
      roleId: "super-admin-role",
      defaultBranchId: "super-admin-branch",
      status: "active",
      user: session.user,
      membership: null,
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
          permissions: {
            select: {
              permission: {
                select: {
                  key: true,
                },
              },
            },
          },
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
    console.log("[AUTH_GUARD] No active membership for user:", session.user.email);
    throw new Error("AUTH_NO_MEMBERSHIP");
  }

  return {
    ...(membership as any),
    user: session.user,
    membership: membership as any, // Cast to any to expose nested relations to callers
    tenantId: membership.tenantId,
  };
}
