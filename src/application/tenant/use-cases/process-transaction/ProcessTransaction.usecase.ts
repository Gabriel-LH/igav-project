import { IUnitOfWork } from "../../../../domain/tenant/repositories/IUnitOfWork";
import { TransactionFinancials } from "../../../../domain/tenant/logic/TransactionFinancials";
import { TenantRepository } from "../../../../domain/tenant/repositories/TenantRepository";
import { CashSessionRepository } from "../../../../domain/tenant/repositories/CashSessionRepository";
import { ITransactionStrategy } from "./ITransactionStrategy";
import { calculateTaxTotals } from "../../../../utils/pricing/tax-calculation";

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
    private readonly cashSessionRepo: CashSessionRepository,
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
      
      // Configuration & Session Check
      const config = dto.configSnapshot?.tenant || dto.configSnapshot;
      if (config?.cash?.openingCashRequired) {
        const activeSession = await this.cashSessionRepo.findActiveSession(
          tenantId,
          dto.branchId,
        );
        
        if (!activeSession) {
          throw new Error("No se puede procesar la transacción: No hay una sesión de caja abierta en esta sucursal.");
        }
      }
      
      const looksLikeCartItem =
        Array.isArray(dto.items) &&
        dto.items.every(
          (item: any) =>
            item &&
            typeof item === "object" &&
            "product" in item &&
            "operationType" in item,
        );

      let recalculatedItems: any[] = dto.items;
      let serverGrossSubtotal = 0;
      let serverTotalAfterItemPromos = 0;

      if (looksLikeCartItem) {
        const result = await this.calculatePromotionsUC.execute({
          items: dto.items,
          tenantId,
          branchId: dto.branchId,
          config,
          startDate: dto.rentalDates?.from
            ? new Date(dto.rentalDates.from)
            : dto.startDate
              ? new Date(dto.startDate)
              : undefined,
          endDate: dto.rentalDates?.to
            ? new Date(dto.rentalDates.to)
            : dto.endDate
              ? new Date(dto.endDate)
              : undefined,
        });

        recalculatedItems = result.items;
        serverGrossSubtotal = result.subtotal;
        serverTotalAfterItemPromos = recalculatedItems.reduce(
          (acc: number, item: CartItem) => acc + (item.subtotal || 0),
          0,
        );
      } else {
        const normalizedItems = Array.isArray(dto.items) ? dto.items : [];
        serverGrossSubtotal = normalizedItems.reduce((acc: number, item: any) => {
          const quantity = Math.max(0, Number(item?.quantity ?? 0));
          const listPrice = Number(item?.listPrice ?? item?.priceAtMoment ?? 0);
          return acc + Math.max(0, listPrice) * quantity;
        }, 0);

        serverTotalAfterItemPromos = normalizedItems.reduce((acc: number, item: any) => {
          const quantity = Math.max(0, Number(item?.quantity ?? 0));
          const priceAtMoment = Number(item?.priceAtMoment ?? item?.listPrice ?? 0);
          return acc + Math.max(0, priceAtMoment) * quantity;
        }, 0);
      }

      // Handle global discounts (points, coupons) sent from client
      const extraDiscountTotal = Number(dto.financials?.extraDiscountTotal || 0);
      const baseAmountForTax = Math.max(0, serverTotalAfterItemPromos - (isNaN(extraDiscountTotal) ? 0 : extraDiscountTotal));

      // Recalculate Tax and Rounding
      const taxTotals = calculateTaxTotals(
        baseAmountForTax,
        config.tax,
        dto.paymentMethodType || "cash" 
      );

      const serverNetTotal = Math.max(0, taxTotals.total);
      
      const rawItemDiscount = serverGrossSubtotal - serverTotalAfterItemPromos;
      const serverTotalDiscount = Math.round((rawItemDiscount + extraDiscountTotal) * 100) / 100;

      const dtoWithServerPrices = {
        ...dto,
        items: recalculatedItems,
        financials: {
          ...dto.financials,
          subtotal: isNaN(serverGrossSubtotal) ? 0 : Math.max(0, Math.round(serverGrossSubtotal * 100) / 100),
          itemDiscountTotal: isNaN(rawItemDiscount) ? 0 : Math.max(0, Math.round(rawItemDiscount * 100) / 100),
          extraDiscountTotal: isNaN(extraDiscountTotal) ? 0 : Math.max(0, extraDiscountTotal),
          totalDiscount: isNaN(serverTotalDiscount) ? 0 : Math.max(0, serverTotalDiscount),
          taxAmount: isNaN(taxTotals.taxAmount) ? 0 : Math.max(0, taxTotals.taxAmount),
          totalAmount: isNaN(serverNetTotal) ? 0 : serverNetTotal,
          totalBeforeRounding: isNaN(taxTotals.totalBeforeRounding) ? 0 : Math.max(0, taxTotals.totalBeforeRounding),
          roundingDifference: isNaN(taxTotals.roundingDifference) ? 0 : taxTotals.roundingDifference,
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

      if (financials.hasOverpaymentToKeep && dto.customerId) {
        await this.addClientCreditUC.execute(
          dto.customerId,
          financials.overpayment,
          "overpayment",
          operationId,
        );
      }

      await this.processPaymentUC.execute({
        directPaymentAmount: financials.receivedAmount,
        paymentMethodId: financials.paymentMethodId || undefined,
        creditAppliedAmount: financials.creditAppliedAmount,
        creditPaymentMethodId: financials.creditPaymentMethodId || undefined,
        operationId,
        branchId: dto.branchId,
        sellerId: dto.sellerId,
        tenantId,
        customerId: dto.customerId,
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

      if (dto.customerId) {
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
      }

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
