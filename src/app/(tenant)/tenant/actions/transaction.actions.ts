"use server";

import prisma from "@/src/lib/prisma";
import { makeServerProcessTransaction } from "@/src/infrastructure/tenant/factories/serverProcessTransaction.factory";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { revalidatePath } from "next/cache";

export async function processTransactionAction(dto: Record<string, unknown>) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId, user } = membership;

    if (!tenantId) {
      throw new Error("Tenant ID es obligatorio para procesar transacciones");
    }
    if (!user?.id) {
      throw new Error("Seller ID es obligatorio para procesar transacciones");
    }

    const dtoWithTenant = {
      ...dto,
      tenantId,
      sellerId: user.id,
    };

    // We execute the whole transaction inside a Prisma $transaction
    // This ensures that all database operations succeed together or fail together.
    const result = await prisma.$transaction(async (tx) => {
      const factory = makeServerProcessTransaction(tx);
      return await factory.execute(dtoWithTenant);
    });

    // Optionally revalidate some paths, so the UI updates with the new inventory, sales, etc.
    revalidatePath("/tenant/home", "page");
    revalidatePath("/tenant/pos", "page");
    revalidatePath("/tenant/calendar", "page");

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Error processing transaction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to process transaction",
    };
  }
}
