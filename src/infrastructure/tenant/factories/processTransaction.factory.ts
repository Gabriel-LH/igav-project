import { ProcessTransactionUseCase } from "../../../application/tenant/use-cases/process-transaction/ProcessTransaction.usecase";
import { ZustandUnitOfWork } from "../stores-adapters/ZustandUnitOfWork";
import { ZustandTenantRepository } from "../stores-adapters/ZustandTenantRepository";
import { SaleTransactionStrategy } from "../../../application/tenant/use-cases/process-transaction/SaleTransactionStrategy";
import { RentalTransactionStrategy } from "../../../application/tenant/use-cases/process-transaction/RentalTransactionStrategy";
import { ReservationTransactionStrategy } from "../../../application/tenant/use-cases/process-transaction/ReservationTransactionStrategy";
import { CreateSaleUseCase } from "@/src/application/tenant/use-cases/sale/createSale.usecase";
import { CreateRentalUseCase } from "@/src/application/tenant/use-cases/createRental.usecase";
import { CreateReservationUseCase } from "@/src/application/tenant/use-cases/reservation/createReservation.usecase";
import { ZustandSaleRepository } from "../stores-adapters/ZustandSaleRepository";
import { ZustandInventoryRepository } from "../stores-adapters/ZustandInventoryRepository";
import { ZustandReservationRepository } from "../stores-adapters/ZustandReservationRepository";
import { ZustandRentalRepository } from "../stores-adapters/ZustandRentalRepository";
import { ZustandGuaranteeRepository } from "../stores-adapters/ZustandGuaranteeRepository";
import { CreateOperationUseCase } from "../../../application/tenant/use-cases/createOperation.usecase";
import { ProcessInitialPaymentUseCase } from "../../../application/tenant/use-cases/processInitialPayment.usecase";
import { AddClientCreditUseCase } from "@/src/application/tenant/use-cases/client/addClientCredit.usecase";
import { RewardLoyaltyUseCase } from "../../../application/tenant/use-cases/rewardLoyalty.usecase";
import { ProcessReferralUseCase } from "../../../application/tenant/use-cases/processReferral.usecase";
import { ZustandOperationRepository } from "../stores-adapters/ZustandOperationRepository";
import { ZustandPaymentRepository } from "../stores-adapters/ZustandPaymentRepository";
import { ZustandClientCreditRepository } from "../stores-adapters/ZustandClientCreditRepository";
import { ZustandLoyaltyRepository } from "../stores-adapters/ZustandLoyaltyRepository";
import { ZustandReferralRepository } from "../stores-adapters/ZustandReferralRepository";
import { ZustandCouponRepository } from "../stores-adapters/ZustandCouponRepository";

export function makeProcessTransaction(): ProcessTransactionUseCase {
  const inventoryRepo = new ZustandInventoryRepository();
  const reservationRepo = new ZustandReservationRepository();
  const guaranteeRepo = new ZustandGuaranteeRepository();
  const couponRepo = new ZustandCouponRepository();
  const loyaltyRepo = new ZustandLoyaltyRepository();

  return new ProcessTransactionUseCase(
    new ZustandUnitOfWork(),
    new ZustandTenantRepository(),
    undefined as any,
    [
      new SaleTransactionStrategy(
        new CreateSaleUseCase(
          new ZustandSaleRepository(),
          inventoryRepo,
          reservationRepo,
        ),
      ),
      new RentalTransactionStrategy(
        new CreateRentalUseCase(
          new ZustandRentalRepository(),
          reservationRepo,
          guaranteeRepo,
          inventoryRepo,
        ),
      ),
      new ReservationTransactionStrategy(
        new CreateReservationUseCase(reservationRepo, inventoryRepo),
      ),
    ],
    new CreateOperationUseCase(new ZustandOperationRepository()),
    new ProcessInitialPaymentUseCase(
      new ZustandPaymentRepository(),
      undefined as any,
      undefined as any,
      new ZustandClientCreditRepository(),
    ),
    new AddClientCreditUseCase(new ZustandClientCreditRepository()),
    new RewardLoyaltyUseCase(loyaltyRepo),
    new ProcessReferralUseCase(
      new ZustandReferralRepository(),
      couponRepo,
      loyaltyRepo,
    ),
    undefined as any,
  );
}
