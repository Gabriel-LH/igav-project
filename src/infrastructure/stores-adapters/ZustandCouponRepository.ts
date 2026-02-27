import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { useCouponStore } from "../../store/useCouponStore";
import { Coupon } from "../../types/coupon/type.coupon";

export class ZustandCouponRepository implements CouponRepository {
  addCoupon(coupon: Coupon): void {
    useCouponStore.getState().addCoupon(coupon);
  }

  getCouponsByTenant(tenantId: string): Coupon[] {
    return useCouponStore
      .getState()
      .coupons.filter((c) => c.tenantId === tenantId);
  }

  getCouponByCode(code: string): Coupon | undefined {
    return useCouponStore.getState().coupons.find((c) => c.code === code);
  }
}
