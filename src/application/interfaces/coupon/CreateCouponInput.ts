import { Coupon } from "../../../types/coupon/type.coupon";

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
