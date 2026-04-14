export interface ClientCreditRepository {
  addCredit(
    customerId: string,
    amount: number,
    reason: string,
    referenceId?: string,
  ): Promise<void>;

  useCredit(
    customerId: string,
    amount: number,
    reason: string,
    referenceId?: string,
  ): Promise<void>;
}
