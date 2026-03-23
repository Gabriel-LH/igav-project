import { Coupon } from "../../../types/coupon/type.coupon";

export interface CouponRepository {
  addCoupon(coupon: Coupon): Promise<void>;
  getCouponsByTenant(tenantId: string): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  getCouponsByClientIds(
    tenantId: string,
    clientIds: string[],
  ): Promise<Coupon[]>;
}
