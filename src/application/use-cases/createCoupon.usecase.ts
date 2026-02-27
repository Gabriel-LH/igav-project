import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { Coupon } from "../../types/coupon/type.coupon";
import { generateCouponCode } from "../../utils/coupon/generateCouponCode";

export interface CreateCouponInput {
  tenantId: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  minPurchaseAmount?: number;
  assignedToClientId: string;
  origin: Coupon["origin"];
  originReferenceId?: string;
  expiresAt?: Date | null;
}

export class CreateCouponUseCase {
  constructor(private couponRepo: CouponRepository) {}

  execute(data: CreateCouponInput): Coupon {
    const coupons = this.couponRepo.getCouponsByTenant(data.tenantId);
    const existingCodes = new Set(coupons.map((c) => c.code));

    let code: string;
    do {
      code = generateCouponCode();
    } while (existingCodes.has(code));

    const newCoupon: Coupon = {
      id: "COUP-" + crypto.randomUUID(),
      tenantId: data.tenantId,
      code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minPurchaseAmount: data.minPurchaseAmount,
      assignedToClientId: data.assignedToClientId,
      origin: data.origin,
      originReferenceId: data.originReferenceId,
      status: "available",
      expiresAt: data.expiresAt ?? null,
      createdAt: new Date(),
      usedAt: null,
    };

    this.couponRepo.addCoupon(newCoupon);

    return newCoupon;
  }
}
