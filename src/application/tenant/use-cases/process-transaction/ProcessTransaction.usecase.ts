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
import { CalculateCartPromotionsUseCase } from "../promotion/CalculateCartPromotionsUseCase";
import { CartItem } from "../../../../types/cart/type.cart";

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
    private readonly calculatePromotionsUC: CalculateCartPromotionsUseCase,
  ) {}

  async execute(dto: any): Promise<any> {
    return this.unitOfWork.execute(async () => {
      const tenantId = this.tenantRepo.getTenantIdByTransaction(dto);
      
      // Re-calculate promotions on server to ensure consistency and security
      const recalculatedItems = await this.calculatePromotionsUC.execute({
        items: dto.items,
        tenantId,
        branchId: dto.branchId,
        config: dto.configSnapshot?.tenant || dto.configSnapshot, // Handle possible snapshot structure
        startDate: dto.rentalDates?.from ? new Date(dto.rentalDates.from) : undefined,
        endDate: dto.rentalDates?.to ? new Date(dto.rentalDates.to) : undefined,
      });

      // Update DTO with server-calculated items and total
      const serverTotal = recalculatedItems.reduce((acc: number, item: CartItem) => acc + (item.subtotal || 0), 0);
      const dtoWithServerPrices = {
        ...dto,
        items: recalculatedItems,
        financials: {
          ...dto.financials,
          totalAmount: serverTotal,
        }
      };

      const financials = new TransactionFinancials(dtoWithServerPrices.financials);

      const operation = await this.createOperationUC.execute(
        dtoWithServerPrices,
        financials.totalAmount,
        financials.initialNetPaid,
        tenantId,
        {
          policySnapshot: dto.policySnapshot,
          configSnapshot: dto.configSnapshot,
          policyVersion: dto.policyVersion,
          configVersion: dto.configVersion,
        },
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
        dtoWithServerPrices,
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
