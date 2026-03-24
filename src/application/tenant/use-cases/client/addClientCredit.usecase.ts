import { ClientCreditRepository } from "../../../../domain/tenant/repositories/ClientCreditRepository";

export class AddClientCreditUseCase {
  constructor(private clientCreditRepo: ClientCreditRepository) {}

  async execute(
    clientId: string,
    amount: number,
    reason: "overpayment" | "manual_adjustment" | "refund",
    operationId?: string,
  ): Promise<void> {
    if (amount <= 0) return;

    await this.clientCreditRepo.addCredit(clientId, amount, reason, operationId);
  }
}
