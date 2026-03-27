"use server";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import prisma from "@/src/lib/prisma";

export async function getTenantUsersAction() {
    try {
        const access = await requireTenantMembership();
        if (!access.tenantId) return { success: false, error: "No tenant" };
        
        const users = await prisma.user.findMany({
            where: {
                userTenantMemberships: {
                    some: {
                        tenantId: access.tenantId
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
            }
        });
        return { success: true, data: users };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
