import { TransactionFinancials } from "../../../../domain/tenant/logic/TransactionFinancials";

export interface TransactionStrategyResult {
  details: any;
  guarantee?: any;
}

export interface ITransactionStrategy {
  canHandle(type: string): boolean;
  execute(
    dto: any,
    operationId: string,
    tenantId: string,
    financials: TransactionFinancials,
  ): TransactionStrategyResult | Promise<TransactionStrategyResult>;
}
