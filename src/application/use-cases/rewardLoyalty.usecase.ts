import { LoyaltyRepository } from "../../domain/repositories/LoyaltyRepository";

export class RewardLoyaltyUseCase {
  constructor(private loyaltyRepo: LoyaltyRepository) {}

  execute(
    downPayment: number,
    totalAmount: number,
    customerId: string,
    operationType: string,
    operationId: string,
  ): void {
    const actualPaidForPoints = Math.min(downPayment, totalAmount);

    if (actualPaidForPoints > 0) {
      const pointsEarned = Math.floor(actualPaidForPoints / 10);
      if (pointsEarned > 0) {
        this.loyaltyRepo.addPoints(
          customerId,
          pointsEarned,
          "earned_purchase",
          String(operationId),
          `Puntos por pago inicial de ${operationType}`,
        );
      }
    }
  }
}
