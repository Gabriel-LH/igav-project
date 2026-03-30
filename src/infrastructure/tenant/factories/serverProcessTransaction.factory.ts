import { PrismaClient, Prisma } from "@/prisma/generated/client";
import { PrismaOperationRepository } from "../repositories/PrismaOperationRepository";
import { PrismaPaymentRepository } from "../repositories/PrismaPaymentRepository";
import { PrismaSaleRepository } from "../repositories/PrismaSaleRepository";
import { PrismaRentalRepository } from "../repositories/PrismaRentalRepository";
import { PrismaReservationRepository } from "../repositories/PrismaReservationRepository";
import { PrismaInventoryRepository } from "../repositories/PrismaInventoryRepository";
import { PrismaTenantRepository } from "../repositories/PrismaTenantRepository";
import { PrismaGuaranteeRepository } from "../repositories/PrismaGuaranteeRepository";
import { PrismaLoyaltyRepository } from "../repositories/PrismaLoyaltyRepository";
import { PrismaClientCreditRepository } from "../repositories/PrismaClientCreditRepository";
import { PrismaReferralRepository } from "../repositories/PrismaReferralRepository";
import { PrismaCouponRepository } from "../repositories/PrismaCouponRepository";
import { PrismaPromotionAdapter } from "../stores-adapters/prisma-promotion.adapter";
import { PrismaConfigAdapter } from "../stores-adapters/prisma-config.adapter";
import { PrismaUnitOfWork } from "../repositories/PrismaUnitOfWork";
import { CalculateCartPromotionsUseCase } from "@/src/application/tenant/use-cases/promotion/CalculateCartPromotionsUseCase";

import { ProcessTransactionUseCase } from "@/src/application/tenant/use-cases/process-transaction/ProcessTransaction.usecase";
import { CreateOperationUseCase } from "@/src/application/tenant/use-cases/createOperation.usecase";
import { ProcessInitialPaymentUseCase } from "@/src/application/tenant/use-cases/processInitialPayment.usecase";
import { AddClientCreditUseCase } from "@/src/application/tenant/use-cases/client/addClientCredit.usecase";
import { RewardLoyaltyUseCase } from "@/src/application/tenant/use-cases/rewardLoyalty.usecase";
import { ProcessReferralUseCase } from "@/src/application/tenant/use-cases/processReferral.usecase";

import { SaleTransactionStrategy } from "@/src/application/tenant/use-cases/process-transaction/SaleTransactionStrategy";
import { RentalTransactionStrategy } from "@/src/application/tenant/use-cases/process-transaction/RentalTransactionStrategy";
import { ReservationTransactionStrategy } from "@/src/application/tenant/use-cases/process-transaction/ReservationTransactionStrategy";
import { CreateSaleUseCase } from "@/src/application/tenant/use-cases/sale/createSale.usecase";
import { CreateRentalUseCase } from "@/src/application/tenant/use-cases/createRental.usecase";
import { CreateReservationUseCase } from "@/src/application/tenant/use-cases/reservation/createReservation.usecase";

export function makeServerProcessTransaction(
  tx: PrismaClient | Prisma.TransactionClient,
) {
  // 1. Repositories
  const unitOfWork = new PrismaUnitOfWork();
  const tenantRepo = new PrismaTenantRepository(tx);
  const operationRepo = new PrismaOperationRepository(tx);
  const paymentRepo = new PrismaPaymentRepository(tx);
  const saleRepo = new PrismaSaleRepository(tx);
  const rentalRepo = new PrismaRentalRepository(tx);
  const reservationRepo = new PrismaReservationRepository(tx);
  const inventoryRepo = new PrismaInventoryRepository(tx);
  const guaranteeRepo = new PrismaGuaranteeRepository(tx);
  const loyaltyRepo = new PrismaLoyaltyRepository(tx);
  const clientCreditRepo = new PrismaClientCreditRepository(tx);
  const referralRepo = new PrismaReferralRepository(tx);
  const couponRepo = new PrismaCouponRepository(tx);
  const promoRepo = new PrismaPromotionAdapter();
  const configRepo = new PrismaConfigAdapter();

  // 2. Base Use Cases
  const createSaleUC = new CreateSaleUseCase(
    saleRepo,
    inventoryRepo,
    reservationRepo,
  );
  const createRentalUC = new CreateRentalUseCase(
    rentalRepo,
    reservationRepo,
    guaranteeRepo,
    inventoryRepo,
  );
  const createReservationUC = new CreateReservationUseCase(
    reservationRepo,
    inventoryRepo,
  );

  // 3. Sub-cases
  const createOperationUC = new CreateOperationUseCase(operationRepo);
  const processInitialPaymentUC = new ProcessInitialPaymentUseCase(paymentRepo);
  const addClientCreditUC = new AddClientCreditUseCase(clientCreditRepo);
  const rewardLoyaltyUC = new RewardLoyaltyUseCase(loyaltyRepo);
  const processReferralUC = new ProcessReferralUseCase(
    referralRepo,
    couponRepo,
    loyaltyRepo,
    configRepo,
  );
  
  const calculatePromotionsUC = new CalculateCartPromotionsUseCase(
    promoRepo,
    inventoryRepo
  );

  // 4. Strategies
  const saleStrategy = new SaleTransactionStrategy(createSaleUC);
  const rentalStrategy = new RentalTransactionStrategy(createRentalUC);
  const reservationStrategy = new ReservationTransactionStrategy(createReservationUC);

  const strategies = [saleStrategy, rentalStrategy, reservationStrategy];

  // 5. Main Use Case
  return new ProcessTransactionUseCase(
    unitOfWork,
    tenantRepo,
    strategies,
    createOperationUC,
    processInitialPaymentUC,
    addClientCreditUC,
    rewardLoyaltyUC,
    processReferralUC,
    calculatePromotionsUC,
  );
}
