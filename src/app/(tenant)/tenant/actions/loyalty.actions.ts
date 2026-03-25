"use server";

import prisma from "@/src/lib/prisma";
import { PrismaLoyaltyRepository } from "@/src/infrastructure/tenant/repositories/PrismaLoyaltyRepository";
import { revalidatePath } from "next/cache";

export async function redeemPointsAction(
  customerId: string,
  points: number,
  notes: string
) {
  const loyaltyRepo = new PrismaLoyaltyRepository(prisma);
  
  await loyaltyRepo.addPoints(
    customerId,
    points,
    "redeemed",
    undefined,
    notes
  );

  revalidatePath("/tenant/pos");
  return { success: true };
}
