// src/services/use-cases/processReferrals.ts
import { useReferralStore } from "@/src/store/useReferralStore";
import { mockReferralProgram } from "@/src/mocks/mock.referralProgram";
import { manageLoyaltyPoints } from "./manageLoyaltyPoints";
import { useCouponStore } from "@/src/store/useCouponStore";
import { generateCouponCode } from "@/src/utils/coupon/generateCouponCode";
import { Coupon } from "@/src/types/coupon/type.coupon";

/**
 * Función pura para crear cupones (no debe ser un hook para usarse aquí adentro)
 */
export function generateCoupon(data: {
  tenantId: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  minPurchaseAmount?: number;
  assignedToClientId: string;
  origin: Coupon["origin"];
  originReferenceId?: string;
  expiresAt?: Date | null;
}) {
  const coupons = useCouponStore.getState().coupons;
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

  useCouponStore.getState().addCoupon(newCoupon);
  return newCoupon;
}

export function processReferrals(
  customerId: string,
  tenantId: string,
  trigger: "first_purchase" | "first_payment",
) {
  const referralProgram = mockReferralProgram; // TODO: Fetch from actual DB or store in the future

  if (!referralProgram.isActive) return;
  if (referralProgram.tenantId !== tenantId) return;
  if (referralProgram.triggerCondition !== trigger) return;

  const referralStore = useReferralStore.getState();
  const pendingReferral = referralStore.referrals.find(
    (r) => r.referredClientId === customerId && r.status === "pending",
  );

  if (!pendingReferral) return;

  // Marcar el referido como completado
  pendingReferral.status = "completed";
  pendingReferral.rewardedAt = new Date();
  // TODO: update in store if using fully immutable updates

  // Otorgar recompensa al REFERENTE
  const rewardType = referralProgram.rewardType;
  const rewardValue = referralProgram.rewardValue;

  if (rewardType === "loyalty_points") {
    manageLoyaltyPoints({
      clientId: pendingReferral.referrerClientId,
      points: rewardValue,
      type: "bonus_referral",
      description: "Puntos ganados por programa de referidos",
    });
  } else if (rewardType === "discount_coupon") {
    const expirationDate = new Date();
    if (referralProgram.expiresInDays) {
      expirationDate.setDate(
        expirationDate.getDate() + referralProgram.expiresInDays,
      );
    }

    generateCoupon({
      tenantId,
      discountType: "percentage", // Assuming percentage or logic can be added
      discountValue: rewardValue,
      assignedToClientId: pendingReferral.referrerClientId,
      origin: "referral",
      originReferenceId: pendingReferral.id,
      expiresAt: referralProgram.expiresInDays ? expirationDate : null,
    });
  } else if (rewardType === "wallet_credit") {
    // TODO: implement wallet credit logic
  }
}
