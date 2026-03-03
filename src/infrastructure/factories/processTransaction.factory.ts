import { ProcessTransactionUseCase } from "../../application/use-cases/process-transaction/ProcessTransaction.usecase";
import { ZustandUnitOfWork } from "../stores-adapters/ZustandUnitOfWork";
import { ZustandTenantRepository } from "../stores-adapters/ZustandTenantRepository";
import { SaleTransactionStrategy } from "../../application/use-cases/process-transaction/SaleTransactionStrategy";
import { RentalTransactionStrategy } from "../../application/use-cases/process-transaction/RentalTransactionStrategy";
import { ReservationTransactionStrategy } from "../../application/use-cases/process-transaction/ReservationTransactionStrategy";
import { CreateSaleUseCase } from "../../application/use-cases/createSale.usecase";
import { CreateRentalUseCase } from "../../application/use-cases/createRental.usecase";
import { CreateReservationUseCase } from "../../application/use-cases/createReservation.usecase";
import { ZustandSaleRepository } from "../stores-adapters/ZustandSaleRepository";
import { ZustandInventoryRepository } from "../stores-adapters/ZustandInventoryRepository";
import { ZustandReservationRepository } from "../stores-adapters/ZustandReservationRepository";
import { ZustandRentalRepository } from "../stores-adapters/ZustandRentalRepository";
import { ZustandGuaranteeRepository } from "../stores-adapters/ZustandGuaranteeRepository";
import { CreateOperationUseCase } from "../../application/use-cases/createOperation.usecase";
import { ProcessInitialPaymentUseCase } from "../../application/use-cases/processInitialPayment.usecase";
import { AddClientCreditUseCase } from "../../application/use-cases/addClientCredit.usecase";
import { RewardLoyaltyUseCase } from "../../application/use-cases/rewardLoyalty.usecase";
import { ProcessReferralUseCase } from "../../application/use-cases/processReferral.usecase";
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
    new ProcessInitialPaymentUseCase(new ZustandPaymentRepository()),
    new AddClientCreditUseCase(new ZustandClientCreditRepository()),
    new RewardLoyaltyUseCase(loyaltyRepo),
    new ProcessReferralUseCase(
      new ZustandReferralRepository(),
      couponRepo,
      loyaltyRepo,
    ),
  );
}
