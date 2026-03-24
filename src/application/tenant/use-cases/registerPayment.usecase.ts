import { OperationRepository } from "../../../domain/tenant/repositories/OperationRepository";
import { PaymentRepository } from "../../../domain/tenant/repositories/PaymentRepository";
import { SaleRepository } from "../../../domain/tenant/repositories/SaleRepository";
import { RentalRepository } from "../../../domain/tenant/repositories/RentalRepository";
import { AddClientCreditUseCase } from "./client/addClientCredit.usecase";
import { RewardLoyaltyUseCase } from "./rewardLoyalty.usecase";

import { paymentSchema, Payment } from "../../../types/payments/type.payments";
import {
  calculateOperationPaymentStatus,
  getOperationBalances,
  getNetPostedAmount,
} from "../../../utils/payment-helpers";
export interface RegisterPaymentInput {
  operationId: string;
  amount: number;
  method: string;
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

  async execute({
    operationId,
    amount,
    method,
    userId,
  }: RegisterPaymentInput): Promise<Payment> {
    const now = new Date();
    const operation = await this.operationRepo.getOperationById(operationId);

    if (!operation) throw new Error("Operacion no encontrada");

    const payment = paymentSchema.parse({
      id: `PAY-${crypto.randomUUID().slice(0, 8)}`,
      tenantId: operation.tenantId,
      operationId,
      branchId: operation.branchId,
      receivedById: userId,
      amount,
      direction: "in",
      paymentMethodId: method,
      status: "posted",
      category: "payment",
      date: now,
      createdAt: now,
    });

    await this.paymentRepo.addPayment(payment);

    const operationPayments =
      await this.paymentRepo.getPaymentsByOperationId(operationId);

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

    await this.operationRepo.updateOperationStatus(operationId, paymentStatus);

    if (isCredit && creditAmount > 0) {
      await this.addClientCreditUseCase.execute(
        operation.customerId,
        creditAmount,
        "overpayment",
        operationId,
      );
    }

    if (amount > 0) {
      // NOTE: loyalty is rewarded using totalAmount here. The rewardLoyaltyUseCase divides by 10 inside the method
      await this.rewardLoyaltyUseCase.execute(
        amount, // downPayment equivalent
        operation.totalAmount, // totalAmount
        operation.customerId, // customerId
        operation.type, // operationType
        operationId, // operationId
      );
    }

    if (operation.type === "venta" && balance === 0) {
      const currentSale = await this.saleRepo.getSaleByOperationId(operationId);

      if (currentSale && currentSale.status === "vendido_pendiente_entrega") {
        await this.saleRepo.updateSale(currentSale.id, {
          status: "vendido",
          updatedAt: now,
          updatedBy: userId,
        });
      }
    }

    if (operation.type === "alquiler" && balance === 0) {
      const currentRental = await this.rentalRepo.getRentalByOperationId(operationId);

      if (currentRental && currentRental.status === "reservado_fisico") {
        await this.rentalRepo.updateRental(currentRental.id, {
          status: "alquilado",
          updatedAt: now,
          updatedBy: userId,
        });
      }
    }

    return payment as Payment;
  }
}
