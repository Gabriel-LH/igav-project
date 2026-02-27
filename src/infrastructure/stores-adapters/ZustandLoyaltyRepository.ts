import { LoyaltyRepository } from "../../domain/repositories/LoyaltyRepository";
import { useLoyaltyStore } from "../../store/useLoyaltyStore";
import { useCustomerStore } from "../../store/useCustomerStore";

export class ZustandLoyaltyRepository implements LoyaltyRepository {
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
  ): void {
    useLoyaltyStore.getState().addEntry({
      id: "LYL-" + crypto.randomUUID(),
      clientId,
      amount: points,
      direction: "credit",
      status: "confirmed",
      type,
      operationId,
      description,
      createdAt: new Date(),
    });

    const customerStore = useCustomerStore.getState();
    const customer = customerStore.getCustomerById(clientId);
    if (customer) {
      const isDeduction = type === "redeemed" || type === "expired";
      const adjustment = isDeduction ? -points : points;
      const newBalance = Math.max(0, customer.loyaltyPoints + adjustment);
      customerStore.updateCustomer(clientId, { loyaltyPoints: newBalance });
    }
  }
}
