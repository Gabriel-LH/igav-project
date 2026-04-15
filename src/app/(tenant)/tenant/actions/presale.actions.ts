"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { PrismaOperationRepository } from "@/src/infrastructure/tenant/repositories/PrismaOperationRepository";
import { generateOperationReference } from "@/src/utils/operation/generateOperationReference";
import { revalidatePath } from "next/cache";

/**
 * Guarda una Pre-venta (Operación con estado pendiente)
 */
export async function savePresaleAction(dto: any) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    const userId = membership.user?.id;

    if (!tenantId || !userId) {
      throw new Error("No estás autorizado para realizar esta acción.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const operationRepo = new PrismaOperationRepository(tx);
      const now = new Date();

      // Obtener secuencia de hoy
      const lastSequence = await operationRepo.getLastSequence(tenantId, dto.type);
      const sequence = lastSequence + 1;
      
      // Generar referencia con prefijo PV (Pre-venta)
      const baseRef = generateOperationReference(dto.type as any, now, sequence);
      const referenceCode = baseRef.replace(/^[A-Z]{3}/, "PV"); // Reemplazar ALQ/VEN/RES por PV

      // Preparar datos de la operación
      const operation = await tx.operation.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          sellerId: userId,
          customerId: dto.customerId || null,
          customerMode: dto.customerMode || "registered",
          type: dto.type,
          status: "pendiente",
          paymentStatus: "pendiente",
          referenceCode,
          subtotal: dto.financials?.subtotal || 0,
          discountAmount: dto.financials?.totalDiscount || 0,
          taxAmount: dto.financials?.taxAmount || 0,
          totalAmount: dto.financials?.totalAmount || 0,
          date: now,
          createdAt: now,
          configSnapshot: dto.configSnapshot || {},
          policySnapshot: dto.policySnapshot || {},
        },
      });

      // Guardar items
      if (dto.items && Array.isArray(dto.items)) {
        for (const item of dto.items) {
          if (dto.type === "venta") {
            await tx.saleItem.create({
              data: {
                tenantId,
                operationId: operation.id,
                productId: item.productId,
                variantId: item.variantId,
                stockId: item.stockId || null,
                inventoryItemId: item.inventoryItemId || null,
                quantity: item.quantity,
                unitPrice: item.priceAtMoment,
                subtotal: item.subtotal,
                status: "reservado", // Reservamos el stock para esta pre-venta
              },
            });
          } else if (dto.type === "alquiler") {
             // Lógica para alquiler (RentalItem)
             await tx.rentalItem.create({
               data: {
                 tenantId,
                 operationId: operation.id,
                 productId: item.productId,
                 variantId: item.variantId,
                 inventoryItemId: item.inventoryItemId || null,
                 quantity: item.quantity,
                 unitPrice: item.priceAtMoment,
                 subtotal: item.subtotal,
                 status: "reservado_fisico",
               }
             });
          }
        }
      }

      return {
        id: operation.id,
        referenceCode: operation.referenceCode
      };
    });

    revalidatePath("/tenant/home");
    revalidatePath("/tenant/pos");

    return { success: true, data: result };
  } catch (error: any) {
    console.error("[savePresaleAction] Error:", error);
    return { success: false, error: error.message || "Error al guardar la pre-venta" };
  }
}

/**
 * Busca una Pre-venta por su código de referencia
 */
export async function findPresaleByCodeAction(code: string) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    const operation = await prisma.operation.findFirst({
      where: {
        tenantId,
        referenceCode: code,
        status: "pendiente"
      },
      include: {
        saleItems: {
          include: {
            product: true
          }
        },
        rentalItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!operation) {
      throw new Error("No se encontró ninguna pre-venta pendiente con ese código.");
    }

    return { success: true, data: operation };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
