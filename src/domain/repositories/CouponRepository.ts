import { Coupon } from "../../types/coupon/type.coupon";

export interface CouponRepository {
  addCoupon(coupon: Coupon): void;
  getCouponsByTenant(tenantId: string): Coupon[];
  getCouponByCode(code: string): Coupon | undefined;
}
