// src/application/coupon/useCreateCoupon.ts

import { useCouponStore } from "@/src/store/useCouponStore";
import { Coupon } from "@/src/types/coupon/type.coupon";
import { generateCouponCode } from "@/src/utils/coupon/generateCouponCode";

export function useCreateCoupon() {
  const addCoupon = useCouponStore((s) => s.addCoupon);
  const coupons = useCouponStore((s) => s.coupons);

  function createCoupon(data: {
    tenantId: string;
    discountType: "percentage" | "fixed_amount";
    discountValue: number;
    minPurchaseAmount?: number;
    assignedToClientId: string;
    origin: Coupon["origin"];
    originReferenceId?: string;
    expiresAt?: Date | null;
  }) {
    const existingCodes = new Set(
      coupons.filter((c) => c.tenantId === data.tenantId).map((c) => c.code),
    );

    let code;
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

    addCoupon(newCoupon);

    return newCoupon;
  }

  return { createCoupon };
}
