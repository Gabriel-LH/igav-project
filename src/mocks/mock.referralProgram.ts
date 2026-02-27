// src/mocks/referralProgram.mock.ts

import { ReferralProgram } from "../types/referral/type.referralProgram";

export const mockReferralProgram: ReferralProgram = {
  id: "RP-001",
  tenantId: "tenant-a",

  isActive: true,

  rewardType: "loyalty_points",
  rewardValue: 100,

  triggerCondition: "first_purchase",

  expiresInDays: 30,

  createdAt: new Date(),
};
