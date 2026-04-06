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
                dni: true,
                createdAt: true,
                userTenantMemberships: {
                    where: { tenantId: access.tenantId },
                    select: { id: true },
                    take: 1
                }
            }
        });
        
        const mappedUsers = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            dni: u.dni,
            createdAt: u.createdAt,
            membershipId: u.userTenantMemberships[0]?.id
        }));

        return { success: true, data: mappedUsers };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "No se pudieron cargar los usuarios",
        };
    }
}
