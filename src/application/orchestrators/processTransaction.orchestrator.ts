import { RentalDTO } from "../../interfaces/RentalDTO";
import { ReservationDTO } from "../../interfaces/ReservationDTO";
import { SaleDTO } from "../../interfaces/SaleDTO";
import { RentalFromReservationDTO } from "../../interfaces/RentalFromReservationDTO";
import { SaleFromReservationDTO } from "../../interfaces/SaleFromReservationDTO";

// Infrastructure Adapters
import { ZustandOperationRepository } from "../../infrastructure/stores-adapters/ZustandOperationRepository";
import { ZustandPaymentRepository } from "../../infrastructure/stores-adapters/ZustandPaymentRepository";
import { ZustandSaleRepository } from "../../infrastructure/stores-adapters/ZustandSaleRepository";
import { ZustandReservationRepository } from "../../infrastructure/stores-adapters/ZustandReservationRepository";
import { ZustandRentalRepository } from "../../infrastructure/stores-adapters/ZustandRentalRepository";
import { ZustandClientCreditRepository } from "../../infrastructure/stores-adapters/ZustandClientCreditRepository";
import { ZustandLoyaltyRepository } from "../../infrastructure/stores-adapters/ZustandLoyaltyRepository";
import { ZustandReferralRepository } from "../../infrastructure/stores-adapters/ZustandReferralRepository";
import { ZustandInventoryRepository } from "../../infrastructure/stores-adapters/ZustandInventoryRepository";
import { ZustandGuaranteeRepository } from "../../infrastructure/stores-adapters/ZustandGuaranteeRepository";
import { ZustandTenantRepository } from "../../infrastructure/stores-adapters/ZustandTenantRepository";
import { ZustandCouponRepository } from "../../infrastructure/stores-adapters/ZustandCouponRepository";

// Application Use Cases
import { CreateOperationUseCase } from "../use-cases/createOperation.usecase";
import { ProcessInitialPaymentUseCase } from "../use-cases/processInitialPayment.usecase";
import { AddClientCreditUseCase } from "../use-cases/addClientCredit.usecase";
import { CreateSaleUseCase } from "../use-cases/createSale.usecase";
import { CreateReservationUseCase } from "../use-cases/createReservation.usecase";
import { CreateRentalUseCase } from "../use-cases/createRental.usecase";
import { RewardLoyaltyUseCase } from "../use-cases/rewardLoyalty.usecase";
import { ProcessReferralUseCase } from "../use-cases/processReferral.usecase";

// Helper Functions
function getFinancials(
  dto:
    | SaleDTO
    | RentalDTO
    | ReservationDTO
    | RentalFromReservationDTO
    | SaleFromReservationDTO,
) {
  const keepAsCredit = dto.financials.keepAsCredit ?? false;

  return {
    totalAmount: dto.financials.totalAmount,
    paymentMethod: dto.financials.paymentMethod,
    downPayment: dto.financials.receivedAmount ?? 0,
    receivedAmount: dto.financials.receivedAmount ?? 0,
    keepAsCredit,
  };
}

export function processTransaction(
  dto:
    | SaleDTO
    | RentalDTO
    | ReservationDTO
    | RentalFromReservationDTO
    | SaleFromReservationDTO,
) {
  // 0️⃣ Instanciar Repositorios
  const operationRepo = new ZustandOperationRepository();
  const paymentRepo = new ZustandPaymentRepository();
  const saleRepo = new ZustandSaleRepository();
  const reservationRepo = new ZustandReservationRepository();
  const rentalRepo = new ZustandRentalRepository();
  const inventoryRepo = new ZustandInventoryRepository();
  const clientCreditRepo = new ZustandClientCreditRepository();
  const loyaltyRepo = new ZustandLoyaltyRepository();
  const referralRepo = new ZustandReferralRepository();
  const guaranteeRepo = new ZustandGuaranteeRepository();
  const tenantRepo = new ZustandTenantRepository();
  const couponRepo = new ZustandCouponRepository();

  // 1️⃣ Instanciar Casos de Uso
  const createOperationUC = new CreateOperationUseCase(operationRepo);
  const processPaymentUC = new ProcessInitialPaymentUseCase(paymentRepo);
  const addClientCreditUC = new AddClientCreditUseCase(clientCreditRepo);
  const rewardLoyaltyUC = new RewardLoyaltyUseCase(loyaltyRepo);
  const processReferralUC = new ProcessReferralUseCase(
    referralRepo,
    couponRepo,
    loyaltyRepo,
  );

  // 2️⃣ Resolver Tenant y Extraer Financieros
  const tenantId = tenantRepo.getTenantIdByTransaction(dto);
  const {
    totalAmount,
    downPayment,
    paymentMethod,
    receivedAmount,
    keepAsCredit,
  } = getFinancials(dto);

  const initialNetPaid = downPayment > 0 ? downPayment : 0;
  const overpayment =
    receivedAmount > totalAmount ? receivedAmount - totalAmount : 0;

  // 3️⃣ Orquestar: Operación Primaria
  const operation = createOperationUC.execute(dto, totalAmount, initialNetPaid);
  const operationId = operation.id;

  // 4️⃣ Orquestar: Pagos y Créditos
  if (overpayment > 0 && keepAsCredit) {
    addClientCreditUC.execute(
      dto.customerId,
      overpayment,
      "overpayment",
      String(operationId),
    );
  }

  processPaymentUC.execute({
    downPayment,
    paymentMethod,
    operationId: String(operationId),
    branchId: dto.branchId,
    sellerId: dto.sellerId,
  });

  // 5️⃣ Orquestar: Detalles por Tipo de Transacción
  let specificData: any = {};
  let guaranteeData: any = null;

  if (dto.type === "venta") {
    const createSaleUC = new CreateSaleUseCase(
      saleRepo,
      inventoryRepo,
      reservationRepo,
    );
    specificData = createSaleUC.execute(
      dto as SaleDTO | SaleFromReservationDTO,
      String(operationId),
      tenantId,
      totalAmount,
      paymentMethod,
    );
  } else if (dto.type === "reserva") {
    const createReservationUC = new CreateReservationUseCase(
      reservationRepo,
      inventoryRepo,
    );
    specificData = createReservationUC.execute(
      dto as ReservationDTO,
      String(operationId),
      totalAmount,
    );
  } else if (dto.type === "alquiler") {
    const createRentalUC = new CreateRentalUseCase(
      rentalRepo,
      reservationRepo,
      guaranteeRepo,
      inventoryRepo,
    );
    const result = createRentalUC.execute(
      dto as RentalDTO | RentalFromReservationDTO,
      String(operationId),
      tenantId,
    );
    specificData = result.rental;
    guaranteeData = result.guaranteeData;
  }

  // 6️⃣ Orquestar: Puntos de Lealtad y Referidos
  rewardLoyaltyUC.execute(
    downPayment,
    totalAmount,
    dto.customerId,
    dto.type,
    String(operationId),
  );

  processReferralUC.execute(dto.customerId, tenantId, "first_purchase");

  return {
    operation,
    payment:
      downPayment > 0 ? { amount: downPayment, method: paymentMethod } : null,
    details: specificData,
    guarantee: guaranteeData,
  };
}
