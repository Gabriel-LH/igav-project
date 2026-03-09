import {
  ITransactionStrategy,
  TransactionStrategyResult,
} from "./ITransactionStrategy";
import { CreateRentalUseCase } from "../createRental.usecase";
import { TransactionFinancials } from "../../../../domain/tenant/logic/TransactionFinancials";
import { RentalDTO } from "../../../dtos/RentalDTO";
import { RentalFromReservationDTO } from "../../../dtos/RentalFromReservationDTO";

export class RentalTransactionStrategy implements ITransactionStrategy {
  constructor(private readonly createRentalUC: CreateRentalUseCase) {}

  canHandle(type: string): boolean {
    return type === "alquiler";
  }

  async execute(
    dto: any,
    operationId: string,
    tenantId: string,
    _financials: TransactionFinancials,
  ): Promise<TransactionStrategyResult> {
    const result = await this.createRentalUC.execute(
      dto as RentalDTO | RentalFromReservationDTO,
      operationId,
      tenantId,
    );

    return { details: result.rental, guarantee: result.guaranteeData };
  }
}
