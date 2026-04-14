import { OperationRepository } from "../../../domain/tenant/repositories/OperationRepository";
import { PaymentRepository } from "../../../domain/tenant/repositories/PaymentRepository";
import { SaleRepository } from "../../../domain/tenant/repositories/SaleRepository";
import { RentalRepository } from "../../../domain/tenant/repositories/RentalRepository";
import { AddClientCreditUseCase } from "./client/addClientCredit.usecase";
import { RewardLoyaltyUseCase } from "./rewardLoyalty.usecase";
import { PaymentMethodCatalogRepository } from "../../../domain/tenant/repositories/PaymentMethodCatalogRepository";
import { ClientRepository } from "../../../domain/tenant/repositories/ClientRepository";
import { ClientCreditRepository } from "../../../domain/tenant/repositories/ClientCreditRepository";

import { paymentSchema, Payment } from "../../../types/payments/type.payments";
import {
  calculateOperationPaymentStatus,
  getOperationBalances,
  getNetPostedAmount,
} from "../../../utils/payment-helpers";
import { DEFAULT_TENANT_POLICY_SECTIONS } from "@/src/lib/tenant-defaults";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
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
    private paymentMethodRepo: PaymentMethodCatalogRepository,
    private clientRepo: ClientRepository,
    private clientCreditRepo: ClientCreditRepository,
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
    const policySnapshot = operation.policySnapshot as TenantPolicy | undefined;
    const policy: TenantPolicy = {
      id: "policy-default",
      tenantId: operation.tenantId,
      version: 1,
      isActive: true,
      createdAt: new Date(0),
      updatedBy: "system",
      ...(DEFAULT_TENANT_POLICY_SECTIONS as TenantPolicy),
      ...(policySnapshot ?? {}),
      sales: {
        ...(DEFAULT_TENANT_POLICY_SECTIONS as TenantPolicy).sales,
        ...(policySnapshot?.sales ?? {}),
      },
    };

    // 1. Obtener detalles del método de pago
    const paymentMethod = await this.paymentMethodRepo.getById(method);
    if (!paymentMethod) throw new Error("Metodo de pago no encontrado");

    // 2. Calcular saldos actuales antes de registrar el nuevo pago
    const existingPayments = await this.paymentRepo.getPaymentsByOperationId(operationId);
    const { balance: remainingAmount } = getOperationBalances(
      operationId,
      existingPayments,
      operation.totalAmount,
    );

    // 3. Ajustar monto si es mayor a lo necesario (Capping logic requested by user)
    let finalAmount = amount;
    if (finalAmount > remainingAmount) {
      finalAmount = remainingAmount;
    }

    if (finalAmount <= 0) {
      throw new Error("La operacion ya esta pagada o el monto es invalido");
    }

    // 4. Lógica específica para CRÉDITO
    if (paymentMethod.type === "credit") {
      const client = await this.clientRepo.getClientById(operation.customerId);
      if (!client) throw new Error("Cliente no encontrado para validar crédito");

      const currentBalance = client.walletBalance || 0;
      if (currentBalance < finalAmount) {
        throw new Error(`Saldo insuficiente. Crédito disponible: S/. ${currentBalance.toFixed(2)}`);
      }

      // Deducción del crédito
      await this.clientCreditRepo.useCredit(
        operation.customerId,
        finalAmount,
        "used_in_operation",
        operationId,
      );
    }

    const payment = paymentSchema.parse({
      id: `PAY-${crypto.randomUUID().slice(0, 8)}`,
      tenantId: operation.tenantId,
      operationId,
      branchId: operation.branchId,
      receivedById: userId,
      amount: finalAmount,
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

      if (
        currentSale &&
        currentSale.status === "vendido_pendiente_entrega" &&
        policy.sales?.autoCompleteDelivery
      ) {
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
