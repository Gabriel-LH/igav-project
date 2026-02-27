import { ClientCreditRepository } from "../../domain/repositories/ClientCreditRepository";
import { useClientCreditStore } from "../../store/useClientCreditStore";

export class ZustandClientCreditRepository implements ClientCreditRepository {
  addCredit(
    customerId: string,
    amount: number,
    reason: string,
    referenceId?: string,
  ): void {
    const newCredit = {
      id: crypto.randomUUID(),
      amount,
      clientId: customerId,
      issuedAt: new Date(),
      expiresAt: null, // Depending on global settings or rules, but for now replicate behavior
      reason: reason as any,
      status: "confirmed" as const,
      referenceId,
      createdAt: new Date(),
      direction: "credit" as const,
    };
    useClientCreditStore.getState().addEntry(newCredit);
  }
}
