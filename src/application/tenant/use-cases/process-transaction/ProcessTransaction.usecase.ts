import { IUnitOfWork } from "../../../../domain/tenant/repositories/IUnitOfWork";
import { TransactionFinancials } from "../../../../domain/tenant/logic/TransactionFinancials";
import { TenantRepository } from "../../../../domain/tenant/repositories/TenantRepository";
import { ITransactionStrategy } from "./ITransactionStrategy";

// Sub-cases
import { CreateOperationUseCase } from "../createOperation.usecase";
import { ProcessInitialPaymentUseCase } from "../processInitialPayment.usecase";
import { AddClientCreditUseCase } from "../client/addClientCredit.usecase";
import { RewardLoyaltyUseCase } from "../rewardLoyalty.usecase";
import { ProcessReferralUseCase } from "../processReferral.usecase";

export class ProcessTransactionUseCase {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly tenantRepo: TenantRepository,
    private readonly transactionStrategies: ITransactionStrategy[],
    private readonly createOperationUC: CreateOperationUseCase,
    private readonly processPaymentUC: ProcessInitialPaymentUseCase,
    private readonly addClientCreditUC: AddClientCreditUseCase,
    private readonly rewardLoyaltyUC: RewardLoyaltyUseCase,
    private readonly processReferralUC: ProcessReferralUseCase,
  ) {}

  async execute(dto: any): Promise<any> {
    return this.unitOfWork.execute(async () => {
      const financials = new TransactionFinancials(dto.financials);
      const tenantId = this.tenantRepo.getTenantIdByTransaction(dto);

      const operation = await this.createOperationUC.execute(
        dto,
        financials.totalAmount,
        financials.initialNetPaid,
        tenantId,
      );
      const operationId = String(operation.id);

      if (financials.hasOverpaymentToKeep) {
        await this.addClientCreditUC.execute(
          dto.customerId,
          financials.overpayment,
          "overpayment",
          operationId,
        );
      }

      await this.processPaymentUC.execute({
        downPayment: financials.downPayment,
        paymentMethodId: financials.paymentMethodId,
        operationId,
        branchId: dto.branchId,
        sellerId: dto.sellerId,
        tenantId,
      });

      const strategy = this.transactionStrategies.find((s) =>
        s.canHandle(dto.type),
      );

      if (!strategy) {
        throw new Error(
          `Strategy not implemented for transaction type: ${dto.type}`,
        );
      }

      const { details, guarantee } = await strategy.execute(
        dto,
        operationId,
        tenantId,
        financials,
      );

      await this.rewardLoyaltyUC.execute(
        financials.downPayment,
        financials.totalAmount,
        dto.customerId,
        dto.type,
        operationId,
      );

      await this.processReferralUC.execute(
        dto.customerId,
        tenantId,
        "first_purchase",
      );

      return {
        operation,
        payment:
          financials.downPayment > 0
            ? {
                amount: financials.downPayment,
                paymentMethodId: financials.paymentMethodId,
              }
            : null,
        details,
        guarantee: guarantee || null,
      };
    });
  }
}
