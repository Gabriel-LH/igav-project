import {
  ITransactionStrategy,
  TransactionStrategyResult,
} from "./ITransactionStrategy";
import { CreateReservationUseCase } from "../reservation/createReservation.usecase";
import { TransactionFinancials } from "../../../../domain/tenant/logic/TransactionFinancials";
import { ReservationDTO } from "../../../dtos/ReservationDTO";

export class ReservationTransactionStrategy implements ITransactionStrategy {
  constructor(private readonly createReservationUC: CreateReservationUseCase) {}

  canHandle(type: string): boolean {
    return type === "reserva";
  }

  async execute(
    dto: ReservationDTO,
    operationId: string,
    tenantId: string,
    financials: TransactionFinancials,
  ): Promise<TransactionStrategyResult> {
    const specificData = await this.createReservationUC.execute(
      dto,
      operationId,
      tenantId,
      financials.totalAmount,
    );

    return { details: specificData, guarantee: null };
  }
}
