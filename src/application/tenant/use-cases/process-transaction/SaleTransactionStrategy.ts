import {
  ITransactionStrategy,
  TransactionStrategyResult,
} from "./ITransactionStrategy";
import { CreateSaleUseCase } from "../sale/createSale.usecase";
import { TransactionFinancials } from "../../../../domain/tenant/logic/TransactionFinancials";
import { SaleDTO } from "../../../dtos/SaleDTO";
import { SaleFromReservationDTO } from "../../../dtos/SaleFromReservationDTO";

export class SaleTransactionStrategy implements ITransactionStrategy {
  constructor(private readonly createSaleUC: CreateSaleUseCase) {}

  canHandle(type: string): boolean {
    return type === "venta";
  }

  async execute(
    dto: any,
    operationId: string,
    tenantId: string,
    financials: TransactionFinancials,
  ): Promise<TransactionStrategyResult> {
    const specificData = await this.createSaleUC.execute(
      dto as SaleDTO | SaleFromReservationDTO,
      operationId,
      tenantId,
      financials.totalAmount,
      financials.paymentMethodId,
    );

    return { details: specificData, guarantee: null };
  }
}
