export interface LoyaltyRepository {
  addPoints(
    clientId: string,
    points: number,
    type:
      | "earned_purchase"
      | "redeemed"
      | "expired"
      | "manual_adjustment"
      | "bonus_referral",
    operationId?: string,
    description?: string,
  ): void;
}
