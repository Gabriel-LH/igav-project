import {
  ITransactionStrategy,
  TransactionStrategyResult,
} from "./ITransactionStrategy";
import { CreateReservationUseCase } from "../createReservation.usecase";
import { TransactionFinancials } from "../../../domain/logic/TransactionFinancials";
import { ReservationDTO } from "../../dtos/ReservationDTO";

export class ReservationTransactionStrategy implements ITransactionStrategy {
  constructor(private readonly createReservationUC: CreateReservationUseCase) {}

  canHandle(type: string): boolean {
    return type === "reserva";
  }

  async execute(
    dto: any,
    operationId: string,
    _tenantId: string,
    financials: TransactionFinancials,
  ): Promise<TransactionStrategyResult> {
    const specificData = await this.createReservationUC.execute(
      dto as ReservationDTO,
      operationId,
      financials.totalAmount,
    );

    return { details: specificData, guarantee: null };
  }
}
