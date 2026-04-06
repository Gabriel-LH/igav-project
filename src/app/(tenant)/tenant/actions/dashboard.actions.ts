"use server";

import prisma from "@/src/lib/prisma";
import { PrismaOperationRepository } from "@/src/infrastructure/tenant/repositories/PrismaOperationRepository";
import { PrismaClientRepository } from "@/src/infrastructure/tenant/repositories/PrismaClientRepository";
import { PrismaInventoryRepository } from "@/src/infrastructure/tenant/repositories/PrismaInventoryRepository";
import { PrismaRentalRepository } from "@/src/infrastructure/tenant/repositories/PrismaRentalRepository";
import { PrismaSaleRepository } from "@/src/infrastructure/tenant/repositories/PrismaSaleRepository";

export async function getDashboardDataAction(tenantId: string) {
  try {
    const operationRepo = new PrismaOperationRepository(prisma);
    const clientRepo = new PrismaClientRepository(prisma, tenantId);
    const inventoryRepo = new PrismaInventoryRepository(prisma);
    const rentalRepo = new PrismaRentalRepository(prisma);
    const saleRepo = new PrismaSaleRepository(prisma);
    // Note: If PrismaCategoryRepository doesn't exist, we might need to use prisma directly or create it.
    // Let's assume it exists based on the pattern or use prisma.category.
    
    const [
      operations,
      customers,
      products,
      rentalItems,
      saleItems,
      sales,
      categories,
      reservations,
      reservationItems,
    ] = await Promise.all([
      operationRepo.getOperationsByTenant(tenantId),
      clientRepo.getAllClients(),
      inventoryRepo.getProducts(),
      rentalRepo.getRentalItems(),
      saleRepo.getSaleItems(),
      saleRepo.getSales(),
      prisma.category.findMany({ where: { tenantId, isActive: true } }),
      prisma.reservation.findMany({ where: { tenantId } }),
      prisma.reservationItem.findMany({ where: { tenantId } }),
    ]);

    return {
      success: true,
      data: {
        operations: JSON.parse(JSON.stringify(operations)),
        customers: JSON.parse(JSON.stringify(customers)),
        products: JSON.parse(JSON.stringify(products)),
        rentalItems: JSON.parse(JSON.stringify(rentalItems)),
        saleItems: JSON.parse(JSON.stringify(saleItems)),
        sales: JSON.parse(JSON.stringify(sales)),
        categories: JSON.parse(JSON.stringify(categories)),
        reservations: JSON.parse(JSON.stringify(reservations)),
        reservationItems: JSON.parse(JSON.stringify(reservationItems)),
      },
    };
  } catch (error: unknown) {
    console.error("Error in getDashboardDataAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al obtener datos del dashboard",
    };
  }
}
