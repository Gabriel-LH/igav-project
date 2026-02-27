import { ReferralRepository } from "../../domain/repositories/ReferralRepository";
import { useReferralStore } from "../../store/useReferralStore";
import { mockReferralProgram } from "../../mocks/mock.referralProgram";
import { Referral } from "../../types/referral/type.referral";

export class ZustandReferralRepository implements ReferralRepository {
  processReferrals(
    customerId: string,
    tenantId: string,
    trigger: "first_purchase" | "first_rental" | "account_creation",
  ): Referral | undefined {
    // We will delegate the complex logic to the processReferral.usecase.ts
    // This adapter is mainly to satisfy the interface if we needed pure store access.
    // For now, implementing the pure store access logic here to keep interface simple.

    const referralProgram = mockReferralProgram;
    if (!referralProgram.isActive) return undefined;
    if (referralProgram.tenantId !== tenantId) return undefined;
    if (referralProgram.triggerCondition !== trigger) return undefined;

    const referralStore = useReferralStore.getState();
    const pendingReferral = referralStore.referrals.find(
      (r) => r.referredClientId === customerId && r.status === "pending",
    );

    if (!pendingReferral) return undefined;

    pendingReferral.status = "rewarded";
    pendingReferral.rewardedAt = new Date();
    // In a real DB we'd save it here. With Zustand mutable state it applies directly.
    return pendingReferral;
  }

  addReferral(
    referral: import("../../types/referral/type.referral").Referral,
  ): void {
    const store = useReferralStore.getState();
    store.referrals.push(referral);
  }
}
