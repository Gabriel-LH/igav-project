import { CouponRepository } from "../../../domain/tenant/repositories/CouponRepository";
import { useCouponStore } from "../../../store/useCouponStore";
import { Coupon } from "../../../types/coupon/type.coupon";

export class ZustandCouponRepository implements CouponRepository {
  async addCoupon(coupon: Coupon): Promise<void> {
    useCouponStore.getState().addCoupon(coupon);
  }

  async getCouponsByTenant(tenantId: string): Promise<Coupon[]> {
    return useCouponStore
      .getState()
      .coupons.filter((c) => c.tenantId === tenantId);
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    return useCouponStore.getState().coupons.find((c) => c.code === code);
  }

  async getCouponsByClientIds(
    tenantId: string,
    clientIds: string[],
  ): Promise<Coupon[]> {
    if (clientIds.length === 0) {
      return [];
    }

    return useCouponStore
      .getState()
      .coupons.filter(
        (coupon) =>
          coupon.tenantId === tenantId &&
          clientIds.includes(coupon.assignedToClientId),
      );
  }
}
