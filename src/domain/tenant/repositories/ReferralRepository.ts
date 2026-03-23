import { Referral } from "../../../types/referral/type.referral";

export interface ReferralRepository {
  processReferrals(
    customerId: string,
    tenantId: string,
    trigger: "first_purchase" | "first_rental" | "account_creation",
  ): Promise<Referral | undefined>;
  addReferral(referral: Referral): Promise<void>;
}
