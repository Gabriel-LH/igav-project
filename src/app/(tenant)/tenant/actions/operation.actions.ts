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
import { DeliverSaleUseCase } from "@/src/application/tenant/use-cases/sale/deliverSale.usecase";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { CancelSaleUseCase } from "@/src/application/tenant/use-cases/sale/cancelSale.usecase";
import { ReturnSaleItemsUseCase } from "@/src/application/tenant/use-cases/returnSaleItems.usecase";
import { PrismaSaleReversalRepository } from "@/src/infrastructure/tenant/repositories/PrismaSaleReversalRepository";
import { PrismaClientCreditRepository } from "@/src/infrastructure/tenant/repositories/PrismaClientCreditRepository";
import { AddClientCreditUseCase } from "@/src/application/tenant/use-cases/client/addClientCredit.usecase";
import { revalidatePath } from "next/cache";
import { ProcessReturnUseCase, ProcessReturnInput } from "@/src/application/tenant/use-cases/processReturn.usecase";
import { ListAttributeTypesUseCase } from "@/src/application/tenant/use-cases/attribute/crudAttributeType.usecase";
import { ListAttributeValuesUseCase } from "@/src/application/tenant/use-cases/attribute/crudAttributeValue.usecase";
import { PrismaAttributeTypeAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-attribute-type.adapter";
import { PrismaAttributeValueAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-attribute-value.adapter";

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

export async function getSalesStoreDataAction(tenantId: string) {
  const saleRepo = new PrismaSaleRepository(prisma);
  const inventoryRepo = new PrismaInventoryRepository(prisma);

  const [sales, saleItems, products, inventoryItems, stockLots] =
    await Promise.all([
      saleRepo.getSales(),
      saleRepo.getSaleItems(),
      inventoryRepo.getProducts(),
      inventoryRepo.getInventoryItems(),
      inventoryRepo.getStockLots(),
    ]);

  return {
    sales: JSON.parse(
      JSON.stringify(sales.filter((sale) => sale.tenantId === tenantId)),
    ),
    saleItems: JSON.parse(
      JSON.stringify(saleItems.filter((item) => item.tenantId === tenantId)),
    ),
    products: JSON.parse(
      JSON.stringify(products.filter((product) => product.tenantId === tenantId)),
    ),
    inventoryItems: JSON.parse(
      JSON.stringify(
        inventoryItems.filter((item) => item.tenantId === tenantId),
      ),
    ),
    stockLots: JSON.parse(
      JSON.stringify(stockLots.filter((lot) => lot.tenantId === tenantId)),
    ),
  };
}

export async function cancelRentalAction(rentalId: string, reason: string, userId: string) {
  const rentalRepo = new PrismaRentalRepository(prisma);
  const guaranteeRepo = new PrismaGuaranteeRepository(prisma);
  const operationRepo = new PrismaOperationRepository(prisma);
  const paymentRepo = new PrismaPaymentRepository(prisma);
  const inventoryRepo = new PrismaInventoryRepository(prisma);

  const useCase = new CancelRentalUseCase(
    rentalRepo,
    guaranteeRepo,
    operationRepo,
    paymentRepo,
    inventoryRepo
  );

  await useCase.execute(rentalId, reason, userId);
  return { success: true };
}

export async function deliverRentalAction(
  rentalId: string, 
  guaranteeData: { value: string; type: GuaranteeType }, 
  userId: string) {
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
  revalidatePath("/tenant/rentals");
  return { success: true };
}

export async function cancelSaleAction(saleId: string, reason: string, userId: string, refundMethod: "refund" | "credit" = "refund") {
  const saleRepo = new PrismaSaleRepository(prisma);
  const reversalRepo = new PrismaSaleReversalRepository(prisma);
  const inventoryRepo = new PrismaInventoryRepository(prisma);
  const paymentRepo = new PrismaPaymentRepository(prisma);
  const operationRepo = new PrismaOperationRepository(prisma);
  const clientCreditRepo = new PrismaClientCreditRepository(prisma);
  const addClientCreditUC = new AddClientCreditUseCase(clientCreditRepo);

  const useCase = new CancelSaleUseCase(
    saleRepo,
    reversalRepo,
    inventoryRepo,
    paymentRepo,
    operationRepo,
    addClientCreditUC
  );

  await useCase.execute({ saleId, reason, userId, refundMethod });
  revalidatePath("/tenant/sales");
  return { success: true };
}

export async function returnSaleItemsAction(
  saleId: string,
  reason: string,
  items: {
    saleItemId: string;
    quantity: number;
    condition?: "perfecto" | "dañado" | "manchado";
    restockingFee: number;
  }[],
  userId: string
) {
  const saleRepo = new PrismaSaleRepository(prisma);
  const reversalRepo = new PrismaSaleReversalRepository(prisma);
  const inventoryRepo = new PrismaInventoryRepository(prisma);
  const paymentRepo = new PrismaPaymentRepository(prisma);
  const operationRepo = new PrismaOperationRepository(prisma);

  const useCase = new ReturnSaleItemsUseCase(
    saleRepo,
    reversalRepo,
    inventoryRepo,
    paymentRepo,
    operationRepo
  );

  await useCase.execute({ saleId, reason, items, userId });
  revalidatePath("/tenant/sales");
  return { success: true };
}

export async function deliverSaleAction(saleId: string, userId: string) {
  const saleRepo = new PrismaSaleRepository(prisma);
  const inventoryRepo = new PrismaInventoryRepository(prisma);
  const reservationRepo = new PrismaReservationRepository(prisma);

  const useCase = new DeliverSaleUseCase(
    saleRepo,
    inventoryRepo,
    reservationRepo
  );

  await useCase.execute(saleId, userId);
  revalidatePath("/tenant/sales");
  return { success: true };
}

export async function processReturnAction(input: ProcessReturnInput) {
  const rentalRepo = new PrismaRentalRepository(prisma);
  const inventoryRepo = new PrismaInventoryRepository(prisma);
  const guaranteeRepo = new PrismaGuaranteeRepository(prisma);
  const operationRepo = new PrismaOperationRepository(prisma);

  const useCase = new ProcessReturnUseCase(
    rentalRepo,
    inventoryRepo,
    guaranteeRepo,
    operationRepo
  );

  const result = await useCase.execute(input);
  revalidatePath("/tenant/returns");
  revalidatePath("/tenant/rentals");
  return { success: true, data: result };
}

export async function getReturnsDataAction(tenantId: string) {
  try {
    const attributeTypeRepo = new PrismaAttributeTypeAdapter();
    const attributeValueRepo = new PrismaAttributeValueAdapter();
    const rentalRepo = new PrismaRentalRepository(prisma);
    const clientRepo = new PrismaClientRepository(prisma, tenantId);
    const guaranteeRepo = new PrismaGuaranteeRepository(prisma);
    const inventoryRepo = new PrismaInventoryRepository(prisma);
    const operationRepo = new PrismaOperationRepository(prisma);
    const listTypes = new ListAttributeTypesUseCase(attributeTypeRepo);
    const listValues = new ListAttributeValuesUseCase(attributeValueRepo);

    const [rentals, rentalItems, products, productVariants, customers, guarantees, operations, types, values] = await Promise.all([
      rentalRepo.getRentals(),
      rentalRepo.getRentalItems(),
      inventoryRepo.getProducts(),
      inventoryRepo.getProductVariants(),
      clientRepo.getAllClients(),
      guaranteeRepo.getGuarantees(tenantId),
      operationRepo.getOperationsByTenant(tenantId),
      listTypes.execute(tenantId, { includeInactive: true }),
      listValues.execute(tenantId, { includeInactive: true }),
    ]);

    const operationsById = new Map(operations.map((op: any) => [op.id, op]));
    const rentalsWithSnapshots = rentals.map((r: any) => {
      const op = operationsById.get(r.operationId);
      return {
        ...r,
        policySnapshot: op?.policySnapshot,
        operationTotalAmount: op?.totalAmount ?? null,
      };
    });

    return {
      success: true,
      data: {
        rentals: rentalsWithSnapshots.filter((r: any) => r.tenantId === tenantId),
        rentalItems: rentalItems.filter((i: any) => i.tenantId === tenantId),
        products: products.filter((p: any) => p.tenantId === tenantId),
        productVariants: productVariants.filter((v: any) => v.tenantId === tenantId),
        customers,
        guarantees,
        attributeTypes: types,
        attributeValues: values,
      },
    };
  } catch (error) {
    console.error("Error al obtener datos de devoluciones:", error);
    return {
      success: false,
      error: "Error al obtener datos de devoluciones",
    };
  }
}
