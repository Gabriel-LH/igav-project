"use server";

import prisma from "@/src/lib/prisma";
import { PrismaRentalRepository } from "@/src/infrastructure/tenant/repositories/PrismaRentalRepository";
import { PrismaClientRepository } from "@/src/infrastructure/tenant/repositories/PrismaClientRepository";
import { PrismaBranchRepository } from "@/src/infrastructure/tenant/repositories/PrismaBranchRepository";
import { PrismaGuaranteeRepository } from "@/src/infrastructure/tenant/repositories/PrismaGuaranteeRepository";
import { PrismaInventoryRepository } from "@/src/infrastructure/tenant/repositories/PrismaInventoryRepository";
import { PrismaOperationRepository } from "@/src/infrastructure/tenant/repositories/PrismaOperationRepository";
import { PrismaUserRepository } from "@/src/infrastructure/tenant/repositories/PrismaUserRepository";
import { GetRentalsGridUseCase } from "@/src/application/tenant/use-cases/GetRentalsGridUseCase";
import { GetSalesGridUseCase } from "@/src/application/tenant/use-cases/GetSalesGridUseCase";

import { PrismaSaleRepository } from "@/src/infrastructure/tenant/repositories/PrismaSaleRepository";
import { PrismaPaymentRepository } from "@/src/infrastructure/tenant/repositories/PrismaPaymentRepository";
import { CancelRentalUseCase } from "@/src/application/tenant/use-cases/cancelRental.usecase";

import { PrismaReservationRepository } from "@/src/infrastructure/tenant/repositories/PrismaReservationRepository";
import { DeliverRentalUseCase } from "@/src/application/tenant/use-cases/deliverRental.usecase";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";

export async function getRentalsGridAction(tenantId: string) {
  const rentalRepo = new PrismaRentalRepository(prisma);
  const clientRepo = new PrismaClientRepository(prisma, tenantId);
  const branchRepo = new PrismaBranchRepository(prisma);
  const guaranteeRepo = new PrismaGuaranteeRepository(prisma);
  const inventoryRepo = new PrismaInventoryRepository(prisma);
  const operationRepo = new PrismaOperationRepository(prisma);
  const userRepo = new PrismaUserRepository(prisma);

  const useCase = new GetRentalsGridUseCase(
    rentalRepo,
    clientRepo,
    branchRepo,
    guaranteeRepo,
    inventoryRepo,
    operationRepo,
    userRepo
  );

  return await useCase.execute(tenantId);
}

export async function getSalesGridAction(tenantId: string) {
  const saleRepo = new PrismaSaleRepository(prisma);
  const clientRepo = new PrismaClientRepository(prisma, tenantId);
  const branchRepo = new PrismaBranchRepository(prisma);
  const inventoryRepo = new PrismaInventoryRepository(prisma);
  const operationRepo = new PrismaOperationRepository(prisma);
  const userRepo = new PrismaUserRepository(prisma);

  const useCase = new GetSalesGridUseCase(
    saleRepo,
    clientRepo,
    branchRepo,
    inventoryRepo,
    operationRepo,
    userRepo
  );

  return await useCase.execute(tenantId);
}

export async function cancelRentalAction(rentalId: string, reason: string, userId: string) {
  const rentalRepo = new PrismaRentalRepository(prisma);
  const guaranteeRepo = new PrismaGuaranteeRepository(prisma);
  const operationRepo = new PrismaOperationRepository(prisma);
  const paymentRepo = new PrismaPaymentRepository(prisma);

  const useCase = new CancelRentalUseCase(
    rentalRepo,
    guaranteeRepo,
    operationRepo,
    paymentRepo
  );

  await useCase.execute(rentalId, reason, userId);
  return { success: true };
}

export async function deliverRentalAction(
  rentalId: string, 
  guaranteeData: { value: string; type: GuaranteeType }, 
  userId: string
) {
  const rentalRepo = new PrismaRentalRepository(prisma);
  const inventoryRepo = new PrismaInventoryRepository(prisma);
  const reservationRepo = new PrismaReservationRepository(prisma);
  const guaranteeRepo = new PrismaGuaranteeRepository(prisma);

  const useCase = new DeliverRentalUseCase(
    rentalRepo,
    inventoryRepo,
    reservationRepo,
    guaranteeRepo
  );

  await useCase.execute(rentalId, guaranteeData, userId);
  return { success: true };
}
