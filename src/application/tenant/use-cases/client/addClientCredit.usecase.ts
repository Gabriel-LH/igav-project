import { ClientCreditRepository } from "../../../../domain/tenant/repositories/ClientCreditRepository";
import { useCustomerStore } from "../../../../store/useCustomerStore";

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

    const customer = useCustomerStore.getState().getCustomerById(clientId);
    const currentBalance = customer?.walletBalance || 0;

    useCustomerStore.getState().updateCustomer(clientId, {
      walletBalance: currentBalance + amount,
    });
  }
}
