export interface ClientCreditRepository {
  addCredit(
    customerId: string,
    amount: number,
    reason: string,
    referenceId?: string,
  ): void;
}
