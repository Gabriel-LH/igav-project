import { OperationRepository } from "../../domain/repositories/OperationRepository";
import { PaymentRepository } from "../../domain/repositories/PaymentRepository";
import { SaleRepository } from "../../domain/repositories/SaleRepository";
import { RentalRepository } from "../../domain/repositories/RentalRepository";
import { AddClientCreditUseCase } from "./addClientCredit.usecase";
import { RewardLoyaltyUseCase } from "./rewardLoyalty.usecase";
import { paymentSchema, Payment } from "../../types/payments/type.payments";
import {
  calculateOperationPaymentStatus,
  getOperationBalances,
  getNetPostedAmount,
} from "../../utils/payment-helpers";
import { PaymentMethodType } from "../../utils/status-type/PaymentMethodType";

export interface RegisterPaymentInput {
  operationId: string;
  amount: number;
  method: PaymentMethodType;
  receivedAmount?: number;
  userId: string;
}

export class RegisterPaymentUseCase {
  constructor(
    private operationRepo: OperationRepository,
    private paymentRepo: PaymentRepository,
    private saleRepo: SaleRepository,
    private rentalRepo: RentalRepository,
    private addClientCreditUseCase: AddClientCreditUseCase,
    private rewardLoyaltyUseCase: RewardLoyaltyUseCase,
  ) {}

  execute({
    operationId,
    amount,
    method,
    receivedAmount,
    userId,
  }: RegisterPaymentInput): Payment {
    const now = new Date();
    const operation = this.operationRepo.getOperationById(operationId);

    if (!operation) throw new Error("Operacion no encontrada");

    const payment = paymentSchema.parse({
      id: `PAY-${crypto.randomUUID().slice(0, 8)}`,
      operationId,
      branchId: operation.branchId,
      receivedById: userId,
      amount,
      direction: "in",
      method,
      status: "posted",
      category: "payment",
      date: now,
    });

    this.paymentRepo.addPayment(payment);

    const operationPayments =
      this.paymentRepo.getPaymentsByOperationId(operationId);

    const netPaid = getNetPostedAmount(operationPayments);
    const paymentStatus = calculateOperationPaymentStatus(
      operation.totalAmount,
      netPaid,
    );

    const { balance, isCredit, creditAmount } = getOperationBalances(
      operationId,
      operationPayments,
      operation.totalAmount,
    );

    this.operationRepo.updateOperationStatus(operationId, paymentStatus);

    if (isCredit && creditAmount > 0) {
      this.addClientCreditUseCase.execute(
        operation.customerId,
        creditAmount,
        "overpayment",
        operationId,
      );
    }

    if (amount > 0) {
      // NOTE: loyalty is rewarded using totalAmount here. The rewardLoyaltyUseCase divides by 10 inside the method
      this.rewardLoyaltyUseCase.execute(
        amount, // downPayment equivalent
        operation.totalAmount, // totalAmount
        operation.customerId, // customerId
        operation.type, // operationType
        operationId, // operationId
      );
    }

    if (operation.type === "venta" && balance === 0) {
      const currentSale = this.saleRepo.getSaleByOperationId(operationId);

      if (currentSale && currentSale.status === "vendido_pendiente_entrega") {
        this.saleRepo.updateSale(currentSale.id, {
          status: "vendido",
          updatedAt: now,
          updatedBy: userId,
        });
      }
    }

    if (operation.type === "alquiler" && balance === 0) {
      const currentRental = this.rentalRepo.getRentalByOperationId(operationId);

      if (currentRental && currentRental.status === "reservado_fisico") {
        this.rentalRepo.updateRental(currentRental.id, {
          status: "alquilado",
          updatedAt: now,
          updatedBy: userId,
        });
      }
    }

    return payment as Payment;
  }
}
