import { ReferralRepository } from "../../../domain/tenant/repositories/ReferralRepository";
import { CouponRepository } from "../../../domain/tenant/repositories/CouponRepository";
import { LoyaltyRepository } from "../../../domain/tenant/repositories/LoyaltyRepository";
import { ConfigRepository } from "../../../domain/tenant/repositories/ConfigRepository";
import { Coupon } from "../../../types/coupon/type.coupon";

export class ProcessReferralUseCase {
  constructor(
    private referralRepo: ReferralRepository,
    private couponRepo: CouponRepository,
    private loyaltyRepo: LoyaltyRepository,
    private configRepo: ConfigRepository,
  ) {}

  async execute(
    customerId: string,
    tenantId: string | null,
    trigger: "first_purchase" | "first_rental" | "account_creation",
  ): Promise<void> {
    if (!tenantId || tenantId === "UNKNOWN_TENANT") return;

    const rewardedReferral = await this.referralRepo.processReferrals(
      customerId,
      tenantId,
      trigger,
    );

    if (!rewardedReferral) return;

    const tenantConfig = this.configRepo.getOrCreateTenantConfig
      ? await this.configRepo.getOrCreateTenantConfig(tenantId)
      : await this.configRepo.getTenantConfig(tenantId);
    const referralConfig = tenantConfig?.referrals;

    if (!referralConfig?.enabled) return;
    if (referralConfig.triggerCondition !== (trigger as "first_purchase" | "first_payment")) {
      return;
    }

    if (referralConfig.rewardType === "discount_coupon") {
      const coupon: Coupon = {
        id: `CUP-REF-${crypto.randomUUID()}`,
        tenantId: tenantId,
        code: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        discountType: referralConfig.couponDiscountType,
        discountValue: referralConfig.rewardValue,
        status: "available",
        createdAt: new Date(),
        assignedToClientId: rewardedReferral.referrerClientId,
        origin: "referral",
        originReferenceId: rewardedReferral.id,
        expiresAt: referralConfig.couponExpiresInDays
          ? new Date(
              Date.now() + referralConfig.couponExpiresInDays * 24 * 60 * 60 * 1000,
            )
          : null,
        usedAt: null,
      };
      await this.couponRepo.addCoupon(coupon);
    } else if (referralConfig.rewardType === "loyalty_points") {
      await this.loyaltyRepo.addPoints(
        rewardedReferral.referrerClientId,
        referralConfig.rewardValue,
        "bonus_referral",
        undefined,
        "Bonus por referido",
      );
    }
  }
}
