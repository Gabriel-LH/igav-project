import { ReferralRepository } from "../../domain/repositories/ReferralRepository";
import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { LoyaltyRepository } from "../../domain/repositories/LoyaltyRepository";
import { mockReferralProgram } from "../../mocks/mock.referralProgram";
import { Coupon } from "../../types/coupon/type.coupon";

export class ProcessReferralUseCase {
  constructor(
    private referralRepo: ReferralRepository,
    private couponRepo: CouponRepository,
    private loyaltyRepo: LoyaltyRepository,
  ) {}

  execute(
    customerId: string,
    tenantId: string | null,
    trigger: "first_purchase" | "first_rental" | "account_creation",
  ): void {
    if (!tenantId || tenantId === "UNKNOWN_TENANT") return;

    const rewardedReferral = this.referralRepo.processReferrals(
      customerId,
      tenantId,
      trigger,
    );

    if (
      rewardedReferral &&
      mockReferralProgram.isActive &&
      mockReferralProgram.tenantId === tenantId
    ) {
      if (mockReferralProgram.rewardType === "discount_coupon") {
        const coupon: Coupon = {
          id: `CUP-REF-${crypto.randomUUID()}`,
          tenantId: tenantId,
          code: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          discountType: "percentage",
          discountValue: mockReferralProgram.rewardValue,
          status: "available",
          createdAt: new Date(),
          assignedToClientId: rewardedReferral.referrerClientId,
          origin: "referral",
          originReferenceId: rewardedReferral.id,
          expiresAt: null,
          usedAt: null,
        };
        this.couponRepo.addCoupon(coupon);
      } else if (mockReferralProgram.rewardType === "loyalty_points") {
        this.loyaltyRepo.addPoints(
          rewardedReferral.referrerClientId,
          mockReferralProgram.rewardValue,
          "bonus_referral",
          undefined,
          "Bonus por referido",
        );
      }
    }
  }
}
